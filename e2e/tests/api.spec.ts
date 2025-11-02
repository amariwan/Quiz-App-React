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
    const res = await request.get('/api/audit');
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });
});
