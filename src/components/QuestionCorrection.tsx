'use client';

import type { QuestionData, SelectionsMap } from '../types';
import Question from './Question';

type Props = {
  questions: QuestionData[];
  selections?: SelectionsMap;
};

export default function QuestionCorrection({ questions, selections = {} }: Props) {
  return (
    <div className="correction">
      {questions.map((question) => {
        const mark = selections[question.id] ?? question.selection ?? null;
        return (
          <Question
            key={`cor-${question.id}`}
            hasButton={false}
            markSelection={mark}
            showAnswer={true}
            data={question}
          />
        );
      })}
    </div>
  );
}
