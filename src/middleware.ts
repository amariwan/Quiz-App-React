import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let limiter: Ratelimit | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m') });
  } catch (e) {
    console.warn(
      '[RATE_LIMIT] Failed to initialize Upstash rate limiter, disabling rate limiting in middleware',
      e,
    );
    limiter = null;
  }
} else {
  console.info('[RATE_LIMIT] UPSTASH credentials not found, middleware will skip rate limiting');
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api')) {
    const xff = req.headers.get('x-forwarded-for');
    const ip = xff ? xff.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? '127.0.0.1');
    if (limiter) {
      try {
        const { success } = await limiter.limit(ip);
        if (!success) return new NextResponse('Too Many Requests', { status: 429 });
      } catch (e) {
        console.error('[RATE_LIMIT] Error checking rate limit, allowing request', e);
      }
    }
    return NextResponse.next();
  }

  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    const nonce = generateNonce();
    const res = NextResponse.next();

    const csp = [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
    ].join('; ');

    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('x-nonce', nonce);

    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'] };
