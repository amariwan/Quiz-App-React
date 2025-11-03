import { expect, test } from '@playwright/test';

test.describe('API endpoints', () => {
  test('GET /api/questions returns JSON and security headers', async ({ request }) => {
    const res = await request.get('/api/questions');
    expect(res.ok()).toBe(true);
    const json = await res.json();
    expect(Array.isArray(json.questions)).toBe(true);
    expect(res.headers()['x-frame-options']).toBe('DENY');
  });

  test('POST /api/submit rejects invalid selections', async ({ request }) => {
    const res = await request.post('/api/submit', {
      data: { selections: 'not-an-object' },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid selections/i);
  });

  test('GET /api/audit requires api key', async ({ request }) => {
    // Increase timeout to avoid transient dev-server slowness
    let res = await request.get('/api/audit', { timeout: 15000 });

    // Next.js dev server can briefly respond with 500 while the route bundle boots.
    for (let attempt = 1; attempt < 3 && res.status() === 500; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      res = await request.get('/api/audit', { timeout: 15000 });
    }

    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });
});
