'use client';

import {
  AntiCheatWarning,
  Question,
  QuestionCorrection,
  Results,
  SecurityDashboard,
} from '@/components';
import useCounter from '@/hooks/useCounter';
import useQuestions from '@/hooks/useQuestions';
import { useTranslation } from '@/i18n/useTranslation';
import { AntiCheat } from '@/lib/anti-cheat';
import { SecureApiClient } from '@/lib/secure-api-client';
import { SecurityEventType, SecurityLevel, SecurityMonitor } from '@/lib/security-monitor';
import React, { useEffect, useRef, useState } from 'react';

export default function Page() {
  const [gameStarted, setGameStarted] = useState(false);
  const { questions, loading, error, reload, setQuestions } = useQuestions();
  const [serverResults, setServerResults] = useState<any | null>(null);
  const gameRef = useRef<HTMLDivElement | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  const [selections, setSelections] = useState<Record<number, number | null>>({});

  const question = useCounter(0);

  const { t } = useTranslation();

  const totalQuestion = (questions?.length ?? 0) - 1;

  // Initialize secure session on mount
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

  // Initialize anti-cheat when game starts
  useEffect(() => {
    if (gameStarted) {
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      AntiCheat.initialize(sessionId);
      questionStartTimeRef.current = Date.now();

      SecurityMonitor.log(
        SecurityEventType.QUIZ_STARTED,
        SecurityLevel.INFO,
        'Quiz started with anti-cheat monitoring',
        { sessionId },
      );
    } else {
      AntiCheat.reset();
    }
  }, [gameStarted]);

  const handleNewQuestionClick = (selectedIndex: number | null, currQuestion: any) => {
    if (questions && totalQuestion >= question.value) {
      // Record answer timing for anti-cheat
      const timeSpent = Date.now() - questionStartTimeRef.current;
      AntiCheat.recordAnswerTiming(currQuestion.id, timeSpent);

      setSelections((prev) => ({ ...prev, [currQuestion.id]: selectedIndex }));
      question.add();

      // Reset timer for next question
      questionStartTimeRef.current = Date.now();
    }
  };

  const resetSelection = () => setSelections({});

  const handleRestartClick = () => {
    resetSelection();
    question.reset();
    setGameStarted(false);
    setServerResults(null);
    SecureApiClient.clearSession();
    AntiCheat.reset();
    SecurityMonitor.log(
      SecurityEventType.QUIZ_STARTED,
      SecurityLevel.INFO,
      'Quiz restarted, session cleared',
    );
  };

  const answeredCount = Object.values(selections).filter((v) => v !== null).length;

  const indicatorBg = (index: number) => {
    if (question.value > index) return '#fff';
    if (question.value === index) return '#29b5d5';
    return 'rgba(255,255,255,.2)';
  };

  useEffect(() => {
    document.body.classList.toggle('game-started', gameStarted);
    if (gameStarted) {
      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Quiz started');
    }
  }, [gameStarted]);

  useEffect(() => {
    if (questions && question.value > totalQuestion && gameRef.current) {
      gameRef.current.scrollTop = 0;
      // submit selections to server to get results using secure API
      (async () => {
        try {
          // Analyze answer patterns
          AntiCheat.analyzeAnswerPattern(selections);

          // Get anti-cheat report
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

          const json = await SecureApiClient.submitAnswers(selections, antiCheatReport);
          setServerResults(json);

          SecurityMonitor.log(
            SecurityEventType.QUIZ_SUBMITTED,
            SecurityLevel.INFO,
            'Quiz results received',
            {
              score: json.score,
              warning: json.warning,
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
        }
      })();
    }
  }, [question.value, questions]);

  // counts for Results: use server results if available, else show answered/empty
  const total = questions ? questions.length : serverResults ? serverResults.results.length : 0;
  const correctCount = serverResults ? serverResults.score : 0;

  // If we have server results, derive empty/wrong from that (most accurate).
  // Otherwise fall back to client-side answered/empty counters.
  const emptyCount = serverResults
    ? serverResults.results.filter((r: any) => r.selection === null).length
    : Math.max(0, questions ? questions.length - answeredCount : 0);

  const wrongCount = Math.max(0, total - correctCount - emptyCount);

  return React.createElement(
    'div',
    {
      className: 'game',
      ref: gameRef,
      'data-game-started': gameStarted ? true : null,
      'data-game-finished': question.value > totalQuestion ? true : null,
    },
    React.createElement(SecurityDashboard),
    gameStarted && React.createElement(AntiCheatWarning),
    React.createElement(
      'div',
      { className: 'intro' },
      React.createElement(
        'div',
        { className: 'intro-inner' },
        React.createElement('h1', { className: 'intro-title' }, t('intro.title')),
        !gameStarted &&
          React.createElement(
            React.Fragment,
            null,
            React.createElement(
              'p',
              { className: 'intro-desc' },
              t('intro.desc', { count: questions ? questions.length : 0 }),
            ),
            React.createElement(
              'button',
              { className: 'intro-button', onClick: () => setGameStarted(true) },
              t('start'),
            ),
          ),
        gameStarted &&
          questions &&
          React.createElement(
            'div',
            { className: 'indicator' },
            questions.map((q, index) =>
              React.createElement('span', {
                key: `ind-${index}`,
                className: 'indicator-item',
                style: { backgroundColor: indicatorBg(index) },
              }),
            ),
          ),
        React.createElement(Results, {
          wrong: wrongCount,
          correct: correctCount,
          empty: emptyCount,
        }),
        React.createElement(
          'button',
          { className: 'restart-button', onClick: () => handleRestartClick() },
          t('restart'),
        ),
      ),
    ),
    React.createElement(
      'div',
      { className: 'game-area' },
      questions &&
        questions[question.value] &&
        React.createElement(Question, {
          data: questions[question.value],
          buttonText: question.value !== totalQuestion ? t('next') : t('finish'),
          onQuestionButtonClick: handleNewQuestionClick,
          markSelection: selections[questions[question.value].id] ?? null,
        }),
      questions &&
        !questions[question.value] &&
        serverResults &&
        React.createElement(
          React.Fragment,
          null,
          // merge server result correctness into questions for correction view
          React.createElement(QuestionCorrection, {
            questions: questions.map((q) => ({
              ...q,
              correct: serverResults.results.find((r: any) => r.id === q.id)?.correct,
            })),
            selections,
          }),
        ),
    ),
  );
}
