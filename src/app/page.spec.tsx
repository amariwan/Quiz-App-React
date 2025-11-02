import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock components to keep the test focused on Page orchestration
jest.mock('@/components', () => ({
  AntiCheatWarning: () => <div data-testid="anti-cheat" />,
  Question: (props: any) => <div data-testid="question">{props.buttonText ?? 'btn'}</div>,
  QuestionCorrection: () => <div data-testid="correction" />,
  Results: () => <div data-testid="results" />,
  SecurityDashboard: () => <div data-testid="security-dashboard" />,
}));

// Mock hooks and libs
jest.mock('@/hooks/useQuestions', () => ({
  __esModule: true,
  default: () => ({
    questions: [{ id: 1, text: 'Q1', answers: ['a', 'b'], correct: 0 }],
    loading: false,
    error: null,
    reload: jest.fn(),
    setQuestions: jest.fn(),
  }),
}));

jest.mock('@/hooks/useCounter', () => ({
  __esModule: true,
  default: (initial = 0) => ({ value: initial, add: jest.fn(), reset: jest.fn() }),
}));

jest.mock('@/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'intro.title': 'Test Title',
        'intro.desc': 'desc',
        start: 'Start Quiz',
        next: 'Next Question',
        finish: 'Finish Quiz',
        restart: 'Restart Quiz',
      };
      return map[k] ?? k;
    },
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

jest.mock('@/lib/secure-api-client', () => ({
  SecureApiClient: {
    initializeSession: jest.fn(async () => undefined),
    submitAnswers: jest.fn(async () => ({ score: 0, results: [] })),
    clearSession: jest.fn(),
  },
}));

jest.mock('@/lib/anti-cheat', () => ({
  AntiCheat: {
    initialize: jest.fn(),
    reset: jest.fn(),
    recordAnswerTiming: jest.fn(),
    analyzeAnswerPattern: jest.fn(),
    getSessionReport: jest.fn(() => ({ suspicionScore: 0, tabSwitches: 0 })),
  },
}));

jest.mock('@/lib/security-monitor', () => ({
  SecurityMonitor: { log: jest.fn() },
  SecurityEventType: {},
  SecurityLevel: {},
}));

import Page from './page';

describe('Page (app/page)', () => {
  it('renders intro and starts game when start clicked', () => {
    render(<Page />);

    // intro title and start button
    expect(screen.getByText('Test Title')).toBeDefined();
    const startBtn = screen.getByText('Start Quiz');
    expect(startBtn).toBeDefined();

    // start the game
    fireEvent.click(startBtn);

    // after starting, SecurityDashboard and AntiCheat should be present (mocked)
    expect(screen.getByTestId('security-dashboard')).toBeDefined();
    expect(screen.getByTestId('anti-cheat')).toBeDefined();
  });
});
