'use client';

import { useTranslation } from '@/i18n/useTranslation';
import type { QuestionData } from '@/types';
import gsap from 'gsap';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  data: QuestionData;
  buttonText?: string | React.ReactNode;
  hasButton?: boolean;
  onQuestionButtonClick?: (selection: number | null, data: QuestionData) => void;
  showAnswer?: boolean;
  markSelection?: number | null;
};

export default function Question({
  data,
  buttonText,
  hasButton = true,
  onQuestionButtonClick,
  showAnswer = false,
  markSelection = null,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState<string | null>(null);
  const parseValue = (value: string | null): number | null =>
    value ? parseInt(value.split('-')[1], 10) : null;
  const questionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (markSelection !== null && markSelection !== undefined) {
      setAnswer(`q${data.id}-${markSelection}`);
    } else {
      setAnswer(null);
    }
  }, [data.id, markSelection]);

  useEffect(() => {
    if (!questionRef.current) return;
    const qText = questionRef.current.querySelector('.question-text');
    const lis = questionRef.current.querySelectorAll('li');
    try {
      gsap.fromTo(qText, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 });
      gsap.fromTo(lis, { opacity: 0, x: 40 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.1 });
    } catch {
      // fail gracefully if gsap not available
    }
  }, [data]);

  return (
    <div className="question" ref={questionRef}>
      <div className="question-inner">
        <h2 className="question-text">{data.text}</h2>
        <ul className="question-answers">
          {data.answers.map((text, index) => {
            const value = `q${data.id}-${index}`;
            return (
              <li
                key={value}
                className={index === data.correct && showAnswer ? 'is-true' : ''}
                data-selected={markSelection === index ? true : null}
              >
                <input
                  type="radio"
                  name={`q_${data.id}`}
                  value={value}
                  id={value}
                  onChange={(e) => setAnswer(e.target.value)}
                  checked={!showAnswer ? answer === value : markSelection === index}
                />
                <label className="question-answer" htmlFor={value}>
                  {text}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      {hasButton && (
        <button
          className="question-button"
          onClick={() => onQuestionButtonClick?.(parseValue(answer), data)}
        >
          {buttonText ?? t('next')}
        </button>
      )}
    </div>
  );
}
