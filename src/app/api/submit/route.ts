import { questions } from '@/data/questions';
import { computeResults } from '@/lib/quiz';
import { blockSession, checkRateLimit, isSessionBlocked, storeSessionData } from '@/lib/rate-limit';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

type Selections = Record<string, number | null>;

interface AntiCheatReport {
  sessionId: string;
  duration: number;
  tabSwitches: number;
  suspiciousEvents: number;
  suspicionScore: number;
  isSuspicious: boolean;
  averageAnswerTime: number;
  events: unknown[];
}

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
};

async function persistResultIfAuthorized(
  score: number,
  results: unknown[],
  request: Request,
  sessionId: string | null,
): Promise<void> {
  try {
    const apiKey = request.headers.get('x-api-key') ?? request.headers.get('X-API-KEY');
    if (!apiKey) return;
    const expected = process.env.API_KEY;
    if (!expected) return;
    if (apiKey !== expected) return;

    const outPath = path.resolve(process.cwd(), 'data', 'results.json');
    let existing: Array<Record<string, unknown>> = [];
    try {
      const raw = await fs.readFile(outPath, 'utf8');
      existing = JSON.parse(raw || '[]');
    } catch {
      existing = [];
    }

    existing.push({
      timestamp: new Date().toISOString(),
      sessionId,
      score,
      results,
    });

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(existing, null, 2), 'utf8');

    console.warn('[SECURITY] Result persisted', { sessionId, score });
  } catch (err) {
    console.error('[SECURITY] Failed to persist result', err);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const sessionId = request.headers.get('X-Session-Id');
    const dataHash = request.headers.get('X-Data-Hash');
    const userAgent = request.headers.get('user-agent');
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Log submission attempt
    console.warn('[SECURITY] Quiz submission received', {
      timestamp: new Date().toISOString(),
      sessionId: sessionId?.substring(0, 16) + '...',
      hasDataHash: !!dataHash,
      userAgent: userAgent?.substring(0, 50),
      clientIp,
    });

    // Check if session is blocked
    if (sessionId) {
      const blocked = await isSessionBlocked(sessionId);
      if (blocked) {
        console.warn('[SECURITY] Blocked session attempted submission', { sessionId });
        return NextResponse.json(
          { error: 'Session blocked due to suspicious activity' },
          { status: 403, headers: securityHeaders },
        );
      }
    }

    // Rate limiting using Upstash
    const identifier = sessionId || clientIp;
    const rateLimitResult = await checkRateLimit(identifier);

    if (!rateLimitResult.success) {
      console.warn('[SECURITY] Rate limit exceeded for submission', {
        identifier,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            ...securityHeaders,
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        },
      );
    }

    const body = await request.json();
    const selections: Selections = body?.selections ?? {};
    const antiCheatReport: AntiCheatReport | null = body?.antiCheatReport ?? null;

    // Validate selections
    if (!selections || typeof selections !== 'object') {
      console.warn('[SECURITY] Invalid selections format', { sessionId });
      return NextResponse.json(
        { error: 'Invalid selections' },
        { status: 400, headers: securityHeaders },
      );
    }

    // Anti-cheat validation
    let isSuspicious = false;
    if (antiCheatReport) {
      console.warn('[ANTI_CHEAT] Report received', {
        sessionId,
        suspicionScore: antiCheatReport.suspicionScore,
        tabSwitches: antiCheatReport.tabSwitches,
        suspiciousEvents: antiCheatReport.suspiciousEvents,
      });

      // Flag highly suspicious sessions
      if (antiCheatReport.suspicionScore >= 70) {
        isSuspicious = true;
        if (sessionId) {
          await blockSession(sessionId, 'High suspicion score');
        }
        console.error('[ANTI_CHEAT] Highly suspicious session detected', {
          sessionId,
          score: antiCheatReport.suspicionScore,
        });
      }

      // Store anti-cheat data
      if (sessionId) {
        await storeSessionData(sessionId, {
          antiCheatReport,
          timestamp: new Date().toISOString(),
          clientIp,
          userAgent,
        });
      }
    }

    // Compute results
    const { score, results } = computeResults(questions, selections);

    // Log results
    console.warn('[SECURITY] Quiz results computed', {
      sessionId: sessionId?.substring(0, 16) + '...',
      score,
      totalQuestions: results.length,
      isSuspicious,
      suspicionScore: antiCheatReport?.suspicionScore ?? 0,
    });

    // Persist if authorized
    await persistResultIfAuthorized(score, results, request, sessionId);

    return NextResponse.json(
      {
        score,
        results,
        // Include warning if suspicious
        ...(isSuspicious && {
          warning: 'Suspicious activity detected. Results may be reviewed.',
        }),
      },
      { headers: securityHeaders },
    );
  } catch (err) {
    console.error('[SECURITY] Error processing submission:', err);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: securityHeaders },
    );
  }
}
