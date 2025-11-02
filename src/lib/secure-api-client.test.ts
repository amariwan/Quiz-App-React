 
import { jest } from '@jest/globals';

// Mocks must be set up before importing the module under test
const mockGenerateKey = jest.fn(async () => ({ key: 'mock-key' }));
const mockExportKey = jest.fn(async (_: any) => 'exported-key');
const mockImportKey = jest.fn(async (_: any) => ({ key: 'imported' }));
const mockEncrypt = jest.fn(async (data: any) => JSON.stringify(data));
const mockDecrypt = jest.fn(async (s: any) => JSON.parse(s));
const mockGenerateHash = jest.fn(async (d: any) => 'hash123');
const mockVerifyHash = jest.fn(async (_d: any, _h: any) => true);

jest.mock('./encryption', () => ({
  E2EEncryption: {
    generateKey: () => mockGenerateKey(),
    exportKey: (k: any) => mockExportKey(k),
    importKey: (s: any) => mockImportKey(s),
    encrypt: (d: any) => mockEncrypt(d),
    decrypt: (s: any) => mockDecrypt(s),
    generateHash: (d: any) => mockGenerateHash(d),
    verifyHash: (d: any, h: any) => mockVerifyHash(d, h),
  },
}));

const mockLog = jest.fn();
const mockIsAllowed = jest.fn(() => true);
const mockGetSummary = jest.fn(() => ({ totalEvents: 0 }));

jest.mock('./security-monitor', () => ({
  SecurityMonitor: {
    log: (...args: any[]) => mockLog(...args),
    getSummary: () => mockGetSummary(),
  },
  SecurityEventType: {
    DATA_ENCRYPTED: 'DATA_ENCRYPTED',
    API_REQUEST: 'API_REQUEST',
    ERROR_OCCURRED: 'ERROR_OCCURRED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    QUIZ_STARTED: 'QUIZ_STARTED',
  },
  SecurityLevel: { INFO: 'INFO', CRITICAL: 'CRITICAL' },
  RateLimiter: { isAllowed: (id: string) => mockIsAllowed(id) },
}));

import { SecureApiClient } from './secure-api-client';

describe('SecureApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // clear sessionStorage
    sessionStorage.clear();
  });

  it('initializeSession generates and stores a key when none exists', async () => {
    expect(sessionStorage.getItem('quiz_encryption_key')).toBeNull();

    await SecureApiClient.initializeSession();

    expect(mockGenerateKey).toHaveBeenCalled();
    expect(mockExportKey).toHaveBeenCalled();
    expect(sessionStorage.getItem('quiz_encryption_key')).toBe('exported-key');
    const summary = SecureApiClient.getSecuritySummary();
    expect(summary.hasEncryptionKey).toBe(true);
  });

  it('fetchQuestions calls fetch and stores encrypted data/hash', async () => {
    // ensure initialized
    await SecureApiClient.initializeSession();

    // mock fetch
    (global as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ questions: [{ id: 1 }] }),
    }));

    const data = await SecureApiClient.fetchQuestions();

    expect(data.questions).toBeDefined();
    expect(mockEncrypt).toHaveBeenCalled();
    expect(mockGenerateHash).toHaveBeenCalled();
    expect(sessionStorage.getItem('quiz_data_encrypted')).toBeDefined();
    expect(sessionStorage.getItem('quiz_data_hash')).toBeDefined();
  });

  it('submitAnswers posts data and stores encrypted result', async () => {
    await SecureApiClient.initializeSession();

    (global as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ score: 2 }) }));

    const res = await SecureApiClient.submitAnswers({ 1: 0 }, { suspicionScore: 0 });

    expect(res.score).toBe(2);
    expect(mockEncrypt).toHaveBeenCalled();
    expect(sessionStorage.getItem('quiz_result_encrypted')).toBeDefined();
  });

  it('getEncryptedQuestions returns decrypted data when keys and hash present', async () => {
    await SecureApiClient.initializeSession();

    // store encrypted data and hash
    sessionStorage.setItem('quiz_data_encrypted', JSON.stringify({ questions: [{ id: 1 }] }));
    sessionStorage.setItem('quiz_data_hash', 'hash123');

    const decrypted = await SecureApiClient.getEncryptedQuestions();
    expect(mockDecrypt).toHaveBeenCalled();
    expect(decrypted).toBeDefined();
  });

  it('clearSession removes session keys and clears internal state', async () => {
    await SecureApiClient.initializeSession();
    sessionStorage.setItem('quiz_data_encrypted', 'x');

    SecureApiClient.clearSession();

    expect(sessionStorage.getItem('quiz_encryption_key')).toBeNull();
    expect(sessionStorage.getItem('quiz_data_encrypted')).toBeNull();
    const summary = SecureApiClient.getSecuritySummary();
    expect(summary.hasEncryptionKey).toBe(false);
  });
});
