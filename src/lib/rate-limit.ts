/**
 * Rate Limiting using Upstash Redis
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// Make sure to set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a rate limiter
    // 5 requests per 1 minute per IP
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'quiz-app',
    });
  }
} catch (error) {
  console.error('[RATE_LIMIT] Failed to initialize Upstash:', error);
}

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: string,
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  // If rate limiter is not configured, allow the request
  if (!ratelimit) {
    console.warn('[RATE_LIMIT] Rate limiter not configured, allowing request');
    return { success: true };
  }

  try {
    const result = await ratelimit.limit(identifier);

    if (!result.success) {
      console.warn('[RATE_LIMIT] Rate limit exceeded', {
        identifier,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      });
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking rate limit:', error);
    // On error, allow the request but log it
    return { success: true };
  }
}

/**
 * Store anti-cheat session data
 */
export async function storeSessionData(sessionId: string, data: any): Promise<void> {
  if (!redis) return;

  try {
    // Store session data with 24 hour expiry
    await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(data));
  } catch (error) {
    console.error('[RATE_LIMIT] Error storing session data:', error);
  }
}

/**
 * Get anti-cheat session data
 */
export async function getSessionData(sessionId: string): Promise<any | null> {
  if (!redis) return null;

  try {
    const data = await redis.get(`session:${sessionId}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch (error) {
    console.error('[RATE_LIMIT] Error getting session data:', error);
    return null;
  }
}

/**
 * Block a session (mark as suspicious)
 */
export async function blockSession(sessionId: string, reason: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.setex(`blocked:${sessionId}`, 86400, reason);
    console.warn('[RATE_LIMIT] Session blocked', { sessionId, reason });
  } catch (error) {
    console.error('[RATE_LIMIT] Error blocking session:', error);
  }
}

/**
 * Check if a session is blocked
 */
export async function isSessionBlocked(sessionId: string): Promise<boolean> {
  if (!redis) return false;

  try {
    const blocked = await redis.get(`blocked:${sessionId}`);
    return !!blocked;
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking if session is blocked:', error);
    return false;
  }
}
