/**
 * Tests for src/middleware.ts
 *
 * Place this file at src/middleware.test.ts
 */

describe('middleware', () => {
  beforeEach(() => {
    jest.resetModules();

    // polyfill btoa and crypto.getRandomValues for Node environment
    (global as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
    (global as any).crypto = {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = i + 1;
        return arr;
      },
    };
  });

  function createResponseFactory() {
    return () => {
      const headersObj: Record<string, string> = {};
      return {
        headers: {
          set: (k: string, v: string) => {
            headersObj[k] = v;
          },
          get: (k: string) => headersObj[k],
        },
      };
    };
  }

  test('skips rate limiting when UPSTASH not configured (limiter === null)', async () => {
    // ensure no Upstash credentials
    process.env.UPSTASH_REDIS_REST_URL = '';
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const createResponse = createResponseFactory();
    jest.doMock('next/server', () => ({
      NextResponse: { next: jest.fn(() => createResponse()) },
    }));

    const { middleware } = await import('./middleware');
    const nextServer = await import('next/server');

    const req = {
      nextUrl: { pathname: '/api/test' },
      headers: { get: (_: string) => null },
    } as any;

    const res = await middleware(req);

    expect(nextServer.NextResponse.next).toHaveBeenCalled();
    expect(res).toBeDefined();
  });

  test('disables rate limiting if Upstash init throws (limiter set to null in catch)', async () => {
    // simulate presence of credentials but Redis constructor throws
    process.env.UPSTASH_REDIS_REST_URL = 'url';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    jest.doMock('@upstash/redis', () => ({
      Redis: jest.fn(() => {
        throw new Error('init fail');
      }),
    }));

    const createResponse = createResponseFactory();
    jest.doMock('next/server', () => ({
      NextResponse: { next: jest.fn(() => createResponse()) },
    }));

    const { middleware } = await import('./middleware');

    const req = {
      nextUrl: { pathname: '/api/some' },
      headers: { get: (_: string) => null },
    } as any;

    const res = await middleware(req);

    // should still allow the request (rate limiting disabled)
    expect(res).toBeDefined();
  });

  test('adds Content-Security-Policy and x-nonce for HTML requests', async () => {
    // no Upstash so limiter === null
    process.env.UPSTASH_REDIS_REST_URL = '';
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const createResponse = createResponseFactory();
    jest.doMock('next/server', () => ({
      NextResponse: { next: jest.fn(() => createResponse()) },
    }));

    const { middleware } = await import('./middleware');

    const req = {
      nextUrl: { pathname: '/' },
      headers: { get: (name: string) => (name === 'accept' ? 'text/html' : null) },
    } as any;

    const res = await middleware(req);

    const nonce = res.headers.get('x-nonce');
    const csp = res.headers.get('Content-Security-Policy');

    expect(nonce).toBeDefined();
    expect(typeof nonce).toBe('string');
    expect(csp).toBeDefined();
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });
});
