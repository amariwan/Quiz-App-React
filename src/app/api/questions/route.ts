import { questions } from '@/data/questions';
import { getPublicQuestions } from '@/lib/quiz';
import { NextResponse } from 'next/server';

// Security headers for enhanced protection
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
};

// Return questions without revealing the correct answers
export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('X-Session-Id');

    // Log request for monitoring
    console.log('[SECURITY] Questions requested', {
      timestamp: new Date().toISOString(),
      sessionId: sessionId?.substring(0, 16) + '...',
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });

    const publicQuestions = getPublicQuestions(questions);

    return NextResponse.json({ questions: publicQuestions }, { headers: securityHeaders });
  } catch (error) {
    console.error('[SECURITY] Error serving questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders },
    );
  }
}
