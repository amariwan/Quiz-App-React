import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
};

/**
 * Get security audit logs
 * Requires API key authentication
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check authentication
    const apiKey = request.headers.get('x-api-key') ?? request.headers.get('X-API-KEY');
    const expected = process.env.API_KEY;

    if (!apiKey || !expected || apiKey !== expected) {
      console.warn('[SECURITY] Unauthorized audit log access attempt', {
        timestamp: new Date().toISOString(),
        hasApiKey: !!apiKey,
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: securityHeaders },
      );
    }

    // Read results/audit data
    const resultsPath = path.resolve(process.cwd(), 'data', 'results.json');
    let results: Array<{ score?: number; sessionId?: string; timestamp?: string }> = [];

    try {
      const raw = await fs.readFile(resultsPath, 'utf8');
      results = JSON.parse(raw || '[]') as Array<{
        score?: number;
        sessionId?: string;
        timestamp?: string;
      }>;
    } catch {
      results = [];
    }

    // Generate audit summary
    const summary = {
      totalSubmissions: results.length,
      averageScore:
        results.length > 0
          ? results.reduce(
              (sum: number, r: { score?: number; sessionId?: string; timestamp?: string }) =>
                sum + (r.score ?? 0),
              0,
            ) / results.length
          : 0,
      recentSubmissions: results.slice(-10),
      uniqueSessions: new Set(
        results
          .map((r: { score?: number; sessionId?: string; timestamp?: string }) => r.sessionId)
          .filter(Boolean),
      ).size,
      dateRange:
        results.length > 0
          ? {
              earliest: results[0]?.timestamp,
              latest: results[results.length - 1]?.timestamp,
            }
          : null,
    };

    console.warn('[SECURITY] Audit log accessed', {
      timestamp: new Date().toISOString(),
      totalRecords: results.length,
    });

    return NextResponse.json(summary, { headers: securityHeaders });
  } catch (error) {
    console.error('[SECURITY] Error retrieving audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders },
    );
  }
}

/**
 * Clear audit logs
 * Requires API key authentication
 */
export async function DELETE(request: Request): Promise<Response> {
  try {
    // Check authentication
    const apiKey = request.headers.get('x-api-key') ?? request.headers.get('X-API-KEY');
    const expected = process.env.API_KEY;

    if (!apiKey || !expected || apiKey !== expected) {
      console.warn('[SECURITY] Unauthorized audit log deletion attempt', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: securityHeaders },
      );
    }

    const resultsPath = path.resolve(process.cwd(), 'data', 'results.json');
    await fs.writeFile(resultsPath, '[]', 'utf8');

    console.warn('[SECURITY] Audit logs cleared', {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Audit logs cleared' }, { headers: securityHeaders });
  } catch (error) {
    console.error('[SECURITY] Error clearing audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders },
    );
  }
}
