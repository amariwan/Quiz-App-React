/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock SecureApiClient and SecurityMonitor
const mockFetch = jest.fn();
jest.mock('@/lib/secure-api-client', () => ({
  SecureApiClient: {
    fetchQuestions: () => mockFetch(),
  },
}));

const mockLog = jest.fn();
jest.mock('@/lib/security-monitor', () => ({
  SecurityMonitor: { log: (a: any, b: any, c: any, d?: any) => mockLog(a, b, c, d) },
  SecurityEventType: { API_REQUEST: 'API_REQUEST', ERROR_OCCURRED: 'ERROR_OCCURRED' },
  SecurityLevel: { INFO: 'INFO', CRITICAL: 'CRITICAL' },
}));

import useQuestions from './useQuestions';

function TestComponent() {
  const { questions, loading, error } = useQuestions();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error ? error.message : ''}</div>
      <div data-testid="list">
        {(questions || []).map((q: any) => (
          <div key={q.id}>{q.text}</div>
        ))}
      </div>
    </div>
  );
}

describe('useQuestions hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads questions on mount and logs activity', async () => {
    mockFetch.mockResolvedValueOnce({
      questions: [
        { id: 1, text: 'Q1' },
        { id: 2, text: 'Q2' },
      ],
    });

    render(<TestComponent />);

    // wait for the first question to appear
    const q = await screen.findByText('Q1');
    expect(q).toBeDefined();

    // ensure SecurityMonitor.log was called at least once
    expect(mockLog).toHaveBeenCalled();
    // loading should be false after load
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('handles fetch errors and sets error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch-failed'));

    render(<TestComponent />);

    const err = await screen.findByText(/fetch-failed/i);
    expect(err).toBeDefined();
    // questions should be an empty array
    expect(screen.getByTestId('list').textContent).toBe('');
  });
});
