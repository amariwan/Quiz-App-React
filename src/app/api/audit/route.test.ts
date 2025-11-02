 
import path from 'path';

type MockResponseInit = {
  status?: number;
  headers?: Record<string, string>;
};

type MockJsonResult<T> = {
  payload: T;
  opts: {
    status?: number;
    headers: Record<string, string>;
  };
};

type HeaderGetter = (name: string) => string | null;

type MockRequest = {
  headers: {
    get: HeaderGetter;
  };
};

const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

const mockJson = jest.fn(<T,>(payload: T, opts?: MockResponseInit): MockJsonResult<T> => ({
  payload,
  opts: {
    status: opts?.status,
    headers: opts?.headers ?? {},
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: mockJson,
  },
}));

// Now import the module under test
import * as auditRoute from './route';

const createRequest = (getter: HeaderGetter): MockRequest => ({
  headers: {
    get: getter,
  },
});

describe('Audit route API', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('GET returns 401 when no api key provided', async () => {
    const req = createRequest(() => null);

    const res = (await auditRoute.GET(req)) as MockJsonResult<{ error: string }>;

    expect(res.payload).toEqual({ error: 'Unauthorized' });
    expect(res.opts).toBeDefined();
    expect(res.opts.status).toBe(401);
    // security headers must be present
    expect(res.opts.headers['X-Frame-Options']).toBe('DENY');
  });

  test('GET returns summary when authorized and file exists', async () => {
    process.env.API_KEY = 'secret-key';

    const sample = [
      { score: 8, sessionId: 's1', timestamp: '2020-01-01T00:00:00.000Z' },
      { score: 2, sessionId: 's2', timestamp: '2020-01-02T00:00:00.000Z' },
      { score: 10, sessionId: 's1', timestamp: '2020-01-03T00:00:00.000Z' },
    ];

    mockReadFile.mockResolvedValueOnce(JSON.stringify(sample));

    const req = createRequest((name) => (name.toLowerCase() === 'x-api-key' ? 'secret-key' : null));

    const res = (await auditRoute.GET(req)) as MockJsonResult<{
      totalSubmissions: number;
      averageScore: number;
      dateRange: { earliest: string; latest: string } | null;
      recentSubmissions: unknown[];
      uniqueSessions: number;
    }>;

    // payload is the summary object
    expect(res.payload.totalSubmissions).toBe(3);
    // averageScore = (8+2+10)/3 = 20/3
    expect(res.payload.averageScore).toBeCloseTo((8 + 2 + 10) / 3);
    expect(res.payload.recentSubmissions.length).toBeGreaterThan(0);
    expect(res.payload.uniqueSessions).toBe(2);
    expect(res.payload.dateRange).toEqual({
      earliest: sample[0].timestamp,
      latest: sample[2].timestamp,
    });

    // ensure readFile was called with the repo data path
    const expectedPath = path.resolve(process.cwd(), 'data', 'results.json');
    expect(mockReadFile).toHaveBeenCalledWith(expectedPath, 'utf8');
  });

  test('GET handles missing file gracefully', async () => {
    process.env.API_KEY = 'secret-key';

    mockReadFile.mockRejectedValueOnce(new Error('file not found'));

    const req = createRequest((name) => (name.toLowerCase() === 'x-api-key' ? 'secret-key' : null));

    const res = (await auditRoute.GET(req)) as MockJsonResult<{
      totalSubmissions: number;
      averageScore: number;
      dateRange: { earliest: string; latest: string } | null;
    }>;

    expect(res.payload.totalSubmissions).toBe(0);
    expect(res.payload.averageScore).toBe(0);
    expect(res.payload.dateRange).toBeNull();
  });

  test('DELETE returns 401 when no api key provided', async () => {
    const req = createRequest(() => null);

    const res = (await auditRoute.DELETE(req)) as MockJsonResult<{ error: string }>;

    expect(res.payload).toEqual({ error: 'Unauthorized' });
    expect(res.opts.status).toBe(401);
  });

  test('DELETE clears file when authorized', async () => {
    process.env.API_KEY = 'secret-key';

    const req = createRequest((name) => (name.toLowerCase() === 'x-api-key' ? 'secret-key' : null));

    mockWriteFile.mockResolvedValueOnce(undefined);

    const res = (await auditRoute.DELETE(req)) as MockJsonResult<{ message: string }>;

    expect(res.payload).toEqual({ message: 'Audit logs cleared' });
    // verify writeFile call
    const expectedPath = path.resolve(process.cwd(), 'data', 'results.json');
    expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, '[]', 'utf8');
    // headers should be present
    expect(res.opts.headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
