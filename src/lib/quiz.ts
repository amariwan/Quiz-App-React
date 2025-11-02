import type { QuestionData } from '@/types';

export function getPublicQuestions(questions: QuestionData[]) {
  return questions.map(({ id, text, answers }) => ({ id, text, answers }));
}

export function computeResults(
  questions: QuestionData[],
  selections: Record<string, number | null>,
) {
  const results = questions.map((q) => {
    const sel = selections[String(q.id)] ?? null;
    const correct = q.correct;
    const isCorrect = sel !== null && sel === correct;
    return {
      id: q.id,
      correct,
      selection: sel,
      isCorrect,
    };
  });

  const score = results.filter((r) => r.isCorrect).length;

  return { score, results };
}
