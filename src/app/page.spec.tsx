import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import type { QuizGameController } from '@/app/hooks/useQuizGame';
import { useQuizGame } from '@/app/hooks/useQuizGame';
import QuizScreen from '@/ui/QuizScreen';
import Page from './page';

type QuizScreenMock = jest.MockedFunction<typeof QuizScreen>;

jest.mock('@/app/hooks/useQuizGame');
jest.mock('@/ui/QuizScreen', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="quiz-screen" />),
}));

jest.mock('@/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

const controllerStub: QuizGameController = {
  loading: false,
  error: null,
  reload: jest.fn(async () => undefined),
  gameStarted: false,
  isFinished: false,
  submitting: false,
  questions: [],
  currentQuestion: null,
  currentIndex: 0,
  totalQuestions: 0,
  selections: {},
  serverResults: null,
  summary: { total: 0, correct: 0, wrong: 0, empty: 0, warning: null },
  progress: [],
  correctionQuestions: null,
  startGame: jest.fn(),
  restartGame: jest.fn(),
  submitAnswer: jest.fn(),
};

describe('Page (app/page)', () => {
  it('renders QuizScreen with controller data and translation fn', () => {
    (useQuizGame as jest.Mock).mockReturnValue(controllerStub);

    render(<Page />);

    expect(QuizScreen as unknown as QuizScreenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ...controllerStub,
        t: expect.any(Function),
      }),
      {},
    );
  });
});
