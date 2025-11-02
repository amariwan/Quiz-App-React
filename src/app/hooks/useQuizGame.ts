'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuizState } from '@/core/hooks/useQuizState';
import type { ResultItem } from '@/core/quiz';
import useQuestions from '@/hooks/useQuestions';
import type { QuestionData, SelectionsMap } from '@/types';
import { AntiCheat } from '@/lib/anti-cheat';
import { SecureApiClient } from '@/lib/secure-api-client';
import { SecurityEventType, SecurityLevel, SecurityMonitor } from '@/lib/security-monitor';

type ServerResults = {
  score: number;
  results: ResultItem[];
  warning?: string;
};

export type QuizProgressState = 'answered' | 'current' | 'upcoming';

export type QuizGameController = {
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  gameStarted: boolean;
  isFinished: boolean;
  submitting: boolean;
  questions: QuestionData[];
  currentQuestion: QuestionData | null;
  currentIndex: number;
  totalQuestions: number;
  selections: SelectionsMap;
  serverResults: ServerResults | null;
  summary: {
    total: number;
    correct: number;
    wrong: number;
    empty: number;
    warning: string | null;
  };
  progress: QuizProgressState[];
  correctionQuestions: QuestionData[] | null;
  startGame: () => void;
  restartGame: () => void;
  submitAnswer: (selection: number | null, question: QuestionData) => void;
};

const createSessionId = () => `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

export function useQuizGame(): QuizGameController {
  const { questions, loading, error, reload } = useQuestions();
  const quizQuestions = questions ?? [];
  const {
    questions: managedQuestions,
    currentIndex,
    currentQuestion,
    selections,
    select,
    next,
    reset: resetQuiz,
    results: localResults,
  } = useQuizState(quizQuestions);

  const [gameStarted, setGameStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [serverResults, setServerResults] = useState<ServerResults | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionStartTimeRef = useRef<number | null>(null);
  const finishTriggeredRef = useRef(false);

  // initialize secure session up-front
  useEffect(() => {
    SecureApiClient.initializeSession().catch((err) => {
      SecurityMonitor.log(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.CRITICAL,
        'Failed to initialize secure session',
        { error: String(err) },
      );
    });
  }, []);

  // start/stop anti-cheat lifecycle
  useEffect(() => {
    if (gameStarted) {
      const sessionId = createSessionId();
      AntiCheat.initialize(sessionId);
      questionStartTimeRef.current = Date.now();

      SecurityMonitor.log(
        SecurityEventType.QUIZ_STARTED,
        SecurityLevel.INFO,
        'Quiz started with anti-cheat monitoring',
        { sessionId },
      );
      return () => {
        AntiCheat.reset();
      };
    }

    AntiCheat.reset();
    questionStartTimeRef.current = null;
  }, [gameStarted]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setIsFinished(false);
    setServerResults(null);
    questionStartTimeRef.current = Date.now();
    finishTriggeredRef.current = false;
  }, []);

  const restartGame = useCallback(() => {
    resetQuiz();
    setGameStarted(false);
    setIsFinished(false);
    setServerResults(null);
    setSubmitting(false);
    questionStartTimeRef.current = null;
    finishTriggeredRef.current = false;
    SecureApiClient.clearSession();
    AntiCheat.reset();
    SecurityMonitor.log(
      SecurityEventType.QUIZ_STARTED,
      SecurityLevel.INFO,
      'Quiz restarted, session cleared',
    );
  }, [resetQuiz]);

  const submitAnswer = useCallback(
    (selection: number | null, question: QuestionData) => {
      if (!gameStarted || isFinished || !question || finishTriggeredRef.current) {
        return;
      }

      if (questionStartTimeRef.current !== null) {
        const spent = Date.now() - questionStartTimeRef.current;
        AntiCheat.recordAnswerTiming(question.id, spent);
      }

      select(question.id, selection);

      const isLastQuestion =
        managedQuestions.length === 0 || currentIndex >= managedQuestions.length - 1;

      if (isLastQuestion) {
        setIsFinished(true);
        questionStartTimeRef.current = null;
        finishTriggeredRef.current = true;
      } else {
        next();
        questionStartTimeRef.current = Date.now();
      }
    },
    [currentIndex, gameStarted, isFinished, managedQuestions.length, next, select],
  );

  // Submit answers once quiz has finished
  useEffect(() => {
    if (!gameStarted || !isFinished || submitting) {
      return;
    }

    if (!managedQuestions.length || serverResults) {
      return;
    }

    setSubmitting(true);
    (async () => {
      try {
        AntiCheat.analyzeAnswerPattern(selections);
        const antiCheatReport = AntiCheat.getSessionReport();

        SecurityMonitor.log(
          SecurityEventType.QUIZ_SUBMITTED,
          SecurityLevel.INFO,
          'Submitting quiz answers with anti-cheat data',
          {
            answerCount: Object.keys(selections).length,
            suspicionScore: antiCheatReport?.suspicionScore ?? 0,
            tabSwitches: antiCheatReport?.tabSwitches ?? 0,
          },
        );

        const result = await SecureApiClient.submitAnswers(selections, antiCheatReport);
        setServerResults(result);

        SecurityMonitor.log(
          SecurityEventType.QUIZ_SUBMITTED,
          SecurityLevel.INFO,
          'Quiz results received',
          {
            score: result.score,
            warning: result.warning,
          },
        );
      } catch (err) {
        SecurityMonitor.log(
          SecurityEventType.ERROR_OCCURRED,
          SecurityLevel.CRITICAL,
          'Failed to submit quiz',
          { error: String(err) },
        );
        setServerResults(null);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [gameStarted, isFinished, managedQuestions.length, selections, serverResults, submitting]);

  useEffect(() => {
    if (!gameStarted || !managedQuestions.length) {
      return;
    }
    if (!questionStartTimeRef.current) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentIndex, gameStarted, managedQuestions.length]);

  const summary = useMemo(() => {
    const baseResults = serverResults?.results ?? localResults.results;
    const total = baseResults.length;
    const correct = serverResults ? serverResults.score : localResults.score;
    const empty = baseResults.filter((r) => r.selection === null).length;
    const wrong = Math.max(0, total - correct - empty);

    return {
      total,
      correct,
      wrong,
      empty,
      warning: serverResults?.warning ?? null,
    };
  }, [localResults, serverResults]);

  const progress = useMemo<QuizProgressState[]>(() => {
    if (!managedQuestions.length) {
      return [];
    }
    return managedQuestions.map((question, index) => {
      if (isFinished) {
        return selections[question.id] !== null ? 'answered' : 'upcoming';
      }
      if (index < currentIndex) return 'answered';
      if (index === currentIndex) return 'current';
      return 'upcoming';
    });
  }, [currentIndex, isFinished, managedQuestions, selections]);

  const correctionQuestions = useMemo(() => {
    if (!serverResults) {
      return null;
    }

    const correctById = new Map(serverResults.results.map((item) => [item.id, item.correct]));
    return managedQuestions.map((question) => ({
      ...question,
      correct: correctById.get(question.id) ?? question.correct,
    }));
  }, [managedQuestions, serverResults]);

  return {
    loading,
    error,
    reload,
    gameStarted,
    isFinished,
    submitting,
    questions: managedQuestions,
    currentQuestion,
    currentIndex,
    totalQuestions: managedQuestions.length,
    selections,
    serverResults,
    summary,
    progress,
    correctionQuestions,
    startGame,
    restartGame,
    submitAnswer,
  };
}
