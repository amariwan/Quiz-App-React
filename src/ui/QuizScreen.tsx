'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  AntiCheatWarning,
  Question,
  QuestionCorrection,
  Results,
  SecurityDashboard,
} from '@/components';
import type { QuizGameController, QuizProgressState } from '@/app/hooks/useQuizGame';
import type { QuestionData } from '@/types';

type TranslationFn = (translationKey: string, params?: Record<string, unknown>) => string;

export type QuizScreenProps = {
  t: TranslationFn;
} & Pick<
  QuizGameController,
  | 'gameStarted'
  | 'isFinished'
  | 'loading'
  | 'error'
  | 'submitting'
  | 'questions'
  | 'currentQuestion'
  | 'currentIndex'
  | 'totalQuestions'
  | 'summary'
  | 'progress'
  | 'selections'
  | 'correctionQuestions'
  | 'serverResults'
  | 'startGame'
  | 'restartGame'
  | 'submitAnswer'
>;

const indicatorColor = (state: QuizProgressState): string => {
  switch (state) {
    case 'answered':
      return '#fff';
    case 'current':
      return '#29b5d5';
    default:
      return 'rgba(255,255,255,.2)';
  }
};

export function QuizScreen({
  t,
  gameStarted,
  isFinished,
  loading,
  error,
  submitting,
  questions,
  currentQuestion,
  currentIndex,
  totalQuestions,
  summary,
  progress,
  selections,
  correctionQuestions,
  serverResults,
  startGame,
  restartGame,
  submitAnswer,
}: QuizScreenProps): JSX.Element {
  const gameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.classList.toggle('game-started', gameStarted);
    return () => {
      document.body.classList.remove('game-started');
    };
  }, [gameStarted]);

  useEffect(() => {
    if (isFinished && gameRef.current) {
      gameRef.current.scrollTop = 0;
    }
  }, [isFinished]);

  const introDescription = useMemo(
    () => t('intro.desc', { count: totalQuestions }),
    [t, totalQuestions],
  );

  const buttonText = currentIndex >= totalQuestions - 1 ? t('finish') : t('next');
  const correctionData: QuestionData[] =
    correctionQuestions ?? questions ?? (serverResults?.results?.length ? questions : []);

  const indicator = gameStarted && questions.length > 0 && !isFinished;

  return (
    <div
      className="game"
      ref={gameRef}
      data-game-started={gameStarted ? true : null}
      data-game-finished={isFinished ? true : null}
      aria-busy={loading || submitting ? true : undefined}
    >
      <SecurityDashboard />
      {gameStarted && <AntiCheatWarning />}

      <div className="intro">
        <div className="intro-inner">
          <h1 className="intro-title">{t('intro.title')}</h1>
          {!gameStarted && (
            <>
              <p className="intro-desc">{introDescription}</p>
              {error && (
                <p className="intro-error" role="alert">
                  {error.message}
                </p>
              )}
              <button
                className="intro-button"
                onClick={startGame}
                disabled={loading || submitting}
              >
                {t('start')}
              </button>
            </>
          )}

          {indicator && (
            <div className="indicator">
              {progress.map((state, index) => (
                <span
                  key={`ind-${index}`}
                  className="indicator-item"
                  style={{ backgroundColor: indicatorColor(state) }}
                />
              ))}
            </div>
          )}

          <Results wrong={summary.wrong} correct={summary.correct} empty={summary.empty} />

          <button className="restart-button" onClick={restartGame}>
            {t('restart')}
          </button>
        </div>
      </div>

      <div className="game-area">
        {!isFinished && currentQuestion && (
          <Question
            data={currentQuestion}
            buttonText={buttonText}
            onQuestionButtonClick={submitAnswer}
            markSelection={selections[currentQuestion.id] ?? null}
          />
        )}

        {isFinished && correctionData.length > 0 && serverResults && (
          <QuestionCorrection questions={correctionData} selections={selections} />
        )}
      </div>
    </div>
  );
}

export default QuizScreen;
