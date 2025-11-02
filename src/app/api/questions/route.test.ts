/* eslint-disable @typescript-eslint/no-explicit-any */

const mockJson = jest.fn((payload: any, opts?: any) => ({ payload, opts }));
jest.mock('next/server', () => ({ NextResponse: { json: mockJson } }));

// Mock getPublicQuestions
const mockGetPublic = jest.fn((q: any) =>
  q.map((x: any) => ({ id: x.id, text: x.text, answers: x.answers })),
);
jest.mock('@/lib/quiz', () => ({ getPublicQuestions: (q: any) => mockGetPublic(q) }));

describe('Questions API route', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('GET returns public questions and security headers', async () => {
    // Import after mocks
    const route = await import('./route');

    const req = { headers: { get: (_: string) => 'some-session' } } as any;
    const res: any = await route.GET(req);

    expect(res.payload).toBeDefined();
    expect(res.payload.questions).toBeInstanceOf(Array);
    // ensure getPublicQuestions was called with the bundled questions
    expect(mockGetPublic).toHaveBeenCalled();
    // headers must contain security header
    expect(res.opts.headers['X-Frame-Options']).toBe('DENY');
  });

  test('GET handles internal errors and returns 500 payload', async () => {
    // Create a module mock that throws when called
    jest.doMock('@/lib/quiz', () => ({
      getPublicQuestions: () => {
        throw new Error('boom');
      },
    }));
    const route = await import('./route');

    const req = { headers: { get: (_: string) => null } } as any;
    const res: any = await route.GET(req);

    expect(res.payload).toEqual({ error: 'Internal server error' });
    expect(res.opts.status).toBe(500);
  });
});
