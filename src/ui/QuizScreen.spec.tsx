import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { QuizProgressState } from '@/app/hooks/useQuizGame';
import type { QuestionData, SelectionsMap } from '@/types';
import QuizScreen, { type QuizScreenProps } from './QuizScreen';

jest.mock('@/components', () => {
  const React = require('react');

  type MockQuestionProps = {
    buttonText?: React.ReactNode;
    onQuestionButtonClick?: (selection: number | null, data: QuestionData) => void;
    data: QuestionData;
    markSelection?: number | null;
  };

  type MockResultsProps = {
    correct: number;
    wrong: number;
    empty: number;
  };

  const Question = ({
    buttonText,
    onQuestionButtonClick,
    data,
    markSelection,
  }: MockQuestionProps) =>
    React.createElement(
      'div',
      { 'data-testid': 'question' },
      React.createElement(
        'button',
        {
          onClick: () => onQuestionButtonClick?.(markSelection ?? null, data),
        },
        buttonText,
      ),
    );

  const Results = ({ correct, wrong, empty }: MockResultsProps) =>
    React.createElement('div', { 'data-testid': 'results' }, `${correct}/${wrong}/${empty}`);

  return {
    AntiCheatWarning: () => React.createElement('div', { 'data-testid': 'anti-cheat' }),
    Question,
    QuestionCorrection: () => React.createElement('div', { 'data-testid': 'correction' }),
    Results,
    SecurityDashboard: () => React.createElement('div', { 'data-testid': 'security' }),
  };
});

const t = (key: string, params?: Record<string, unknown>) => {
  if (key === 'intro.desc') {
    return `desc-${params?.count ?? 0}`;
  }
  const dictionary: Record<string, string> = {
    'intro.title': 'Quiz',
    start: 'Start',
    next: 'Next',
    finish: 'Finish',
    restart: 'Restart',
  };
  return dictionary[key] ?? key;
};

const createProps = (
  overrides: Partial<Omit<QuizScreenProps, 't'>> = {},
): Omit<QuizScreenProps, 't'> => ({
  gameStarted: false,
  isFinished: false,
  loading: false,
  error: null,
  submitting: false,
  questions: [] as QuestionData[],
  currentQuestion: null,
  currentIndex: 0,
  totalQuestions: 0,
  summary: { total: 0, correct: 0, wrong: 0, empty: 0, warning: null },
  progress: [] as QuizProgressState[],
  selections: {} as SelectionsMap,
  correctionQuestions: null,
  serverResults: null,
  startGame: jest.fn(),
  restartGame: jest.fn(),
  submitAnswer: jest.fn(),
  ...overrides,
});

describe('QuizScreen', () => {
  it('shows intro state and triggers start callback', () => {
    const props = createProps();
    render(<QuizScreen t={t} {...props} />);

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    expect(props.startGame).toHaveBeenCalledTimes(1);
  });

  it('renders progress indicator when game is running', () => {
    const questions: QuestionData[] = [
      { id: 1, text: 'Q1', answers: ['a'], correct: 0 },
      { id: 2, text: 'Q2', answers: ['a'], correct: 0 },
    ];
    const props = createProps({
      gameStarted: true,
      questions,
      currentQuestion: questions[1],
      currentIndex: 1,
      totalQuestions: questions.length,
      progress: ['answered', 'current'],
    });

    const { container } = render(<QuizScreen t={t} {...props} />);

    const dots = container.querySelectorAll('.indicator-item');
    expect(dots).toHaveLength(2);
    expect((dots[0] as HTMLElement).style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect((dots[1] as HTMLElement).style.backgroundColor).toBe('rgb(41, 181, 213)');
  });

  it('shows correction view after completion', () => {
    const questions: QuestionData[] = [{ id: 1, text: 'Q1', answers: ['a'], correct: 0 }];
    const props = createProps({
      gameStarted: true,
      isFinished: true,
      questions,
      totalQuestions: 1,
      serverResults: {
        score: 1,
        results: [{ id: 1, correct: 0, selection: 0, isCorrect: true }],
        warning: undefined,
      },
      correctionQuestions: questions,
    });

    render(<QuizScreen t={t} {...props} />);

    expect(screen.getByTestId('correction')).toBeInTheDocument();
    expect(screen.queryByTestId('question')).not.toBeInTheDocument();
  });
});
