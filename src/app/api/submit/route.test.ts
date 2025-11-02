/* eslint-disable @typescript-eslint/no-explicit-any */
// Mocks for filesystem and next response
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  mkdir: (...args: any[]) => mockMkdir(...args),
}));

const mockJson = jest.fn((payload: any, opts?: any) => ({ payload, opts }));
jest.mock('next/server', () => ({ NextResponse: { json: mockJson } }));

// Mock computeResults
const mockCompute = jest.fn(() => ({ score: 0, results: [] }));
jest.mock('@/lib/quiz', () => ({
  computeResults: function () {
    // forward to mock compute
    return (mockCompute as any).apply(this, arguments as any);
  },
}));

// Mock rate-limit helpers
const mockIsBlocked = jest.fn(async (id: string) => false);
const mockCheckRate = jest.fn(async () => ({ success: true, limit: 10, remaining: 9, reset: 0 }));
const mockBlockSession = jest.fn(async () => undefined);
const mockStoreSession = jest.fn(async () => undefined);

jest.mock('@/lib/rate-limit', () => ({
  isSessionBlocked: function () {
    return (mockIsBlocked as any).apply(this, arguments as any);
  },
  checkRateLimit: function () {
    return (mockCheckRate as any).apply(this, arguments as any);
  },
  blockSession: function () {
    return (mockBlockSession as any).apply(this, arguments as any);
  },
  storeSessionData: function () {
    return (mockStoreSession as any).apply(this, arguments as any);
  },
}));

describe('Submit route API', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...process.env };
  });

  test('returns 403 when session is blocked', async () => {
    mockIsBlocked.mockResolvedValueOnce(true);
    const route = await import('./route');

    const req = {
      headers: { get: (_: string) => 'session-1' },
      json: async () => ({ selections: {} }),
    } as any;

    const res: any = await route.POST(req);
    expect(res.opts.status).toBe(403);
    expect(res.payload.error).toMatch(/Session blocked/i);
  });

  test('returns 429 when rate limit exceeded', async () => {
    mockIsBlocked.mockResolvedValueOnce(false);
    mockCheckRate.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: 60 });
    const route = await import('./route');

    const req = {
      headers: { get: (_: string) => 'session-1' },
      json: async () => ({ selections: {} }),
    } as any;

    const res: any = await route.POST(req);
    expect(res.opts.status).toBe(429);
    expect(res.opts.headers['X-RateLimit-Limit']).toBe('5');
  });

  test('returns 400 for invalid selections payload', async () => {
    mockIsBlocked.mockResolvedValueOnce(false);
    mockCheckRate.mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, reset: 0 });
    const route = await import('./route');

    const req = {
      headers: { get: (_: string) => null },
      json: async () => ({ selections: 'not-an-object' }),
    } as any;

    const res: any = await route.POST(req);
    expect(res.opts.status).toBe(400);
    expect(res.payload.error).toMatch(/Invalid selections/i);
  });

  test('successful POST computes results and persists when API key provided', async () => {
    mockIsBlocked.mockResolvedValueOnce(false);
    mockCheckRate.mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, reset: 0 });

    // make computeResults return a non-zero score
    mockCompute.mockImplementationOnce(() => ({ score: 2, results: [] }));

    process.env.API_KEY = 'secret-key';

    const route = await import('./route');

    const req = {
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-api-key' ? 'secret-key' : 's1'),
      },
      json: async () => ({ selections: { 1: 0 }, antiCheatReport: { suspicionScore: 10 } }),
    } as any;

    mockReadFile.mockRejectedValueOnce(new Error('no file'));
    mockMkdir.mockResolvedValueOnce(undefined as any);
    mockWriteFile.mockResolvedValueOnce(undefined as any);

    const res: any = await route.POST(req);

    expect(res.payload.score).toBe(2);
    expect(res.payload.results).toBeDefined();
    // ensure persistence was attempted (writeFile called)
    expect(mockWriteFile).toHaveBeenCalled();
  });

  test('high suspicionScore triggers blockSession and returns warning', async () => {
    mockIsBlocked.mockResolvedValueOnce(false);
    mockCheckRate.mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, reset: 0 });

    mockCompute.mockImplementationOnce(() => ({ score: 0, results: [] }));

    process.env.API_KEY = 'secret-key';
    const route = await import('./route');

    const req = {
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-api-key' ? 'secret-key' : 's2'),
      },
      json: async () => ({ selections: {}, antiCheatReport: { suspicionScore: 90 } }),
    } as any;

    const res: any = await route.POST(req);

    expect(mockBlockSession).toHaveBeenCalled();
    expect(res.payload.warning).toBeDefined();
  });
});
