/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import QuestionCorrection from './QuestionCorrection';

const questions = [
  { id: 1, text: 'A', answers: ['a', 'b'], correct: 0, selection: 0 },
  { id: 2, text: 'B', answers: ['x', 'y'], correct: 1, selection: 0 },
] as any;

describe('QuestionCorrection', () => {
  it('renders questions with answers shown and marks selections', () => {
    render(<QuestionCorrection questions={questions} selections={{ 2: 1 }} />);

    // For question 1 selection should be from selection property
    const q1Input = screen.getByDisplayValue('q1-0') as HTMLInputElement;
    expect(q1Input.checked).toBe(true);

    // For question 2 selection from selections prop
    const q2Input = screen.getByDisplayValue('q2-1') as HTMLInputElement;
    expect(q2Input.checked).toBe(true);
  });
});
