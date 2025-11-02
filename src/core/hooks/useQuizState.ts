import { computeResults, ResultItem } from '@/core/quiz';
import type { QuestionData, SelectionsMap } from '@/types';
import { useCallback, useMemo, useState } from 'react';

export function useQuizState(initialQuestions: QuestionData[] = []): {
  questions: QuestionData[];
  currentIndex: number;
  currentQuestion: QuestionData | null;
  selections: SelectionsMap;
  select: (_questionId: number, _optionIndex: number | null) => void;
  next: () => void;
  prev: () => void;
  goTo: (_idx: number) => void;
  reset: () => void;
  results: { score: number; results: ResultItem[] };
} {
  // defensive: ensure array
  const questions = Array.isArray(initialQuestions) ? initialQuestions : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<SelectionsMap>({});

  const currentQuestion = questions[currentIndex] ?? null;

  const select = useCallback((questionId: number, optionIndex: number | null) => {
    setSelections((s) => ({ ...s, [questionId]: optionIndex }));
  }, []);

  const next = useCallback(
    () => setCurrentIndex((i) => Math.min(i + 1, Math.max(questions.length - 1, 0))),
    [questions.length],
  );
  const prev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const goTo = useCallback(
    (idx: number) =>
      setCurrentIndex(() => Math.max(0, Math.min(idx, Math.max(questions.length - 1, 0)))),
    [questions.length],
  );

  const reset = useCallback(() => {
    setSelections({});
    setCurrentIndex(0);
  }, []);

  const results = useMemo(() => computeResults(questions, selections), [questions, selections]);

  return {
    questions,
    currentIndex,
    currentQuestion,
    selections,
    select,
    next,
    prev,
    goTo,
    reset,
    results,
  } as const;
}
