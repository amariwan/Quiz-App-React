export type QuestionData = {
  id: number;
  text: string;
  answers: string[];
  correct: number;
  selection?: number | null;
};

export type SelectionsMap = Record<number, number | null>;
