import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('gsap', () => ({ fromTo: jest.fn() }));

import Question from './Question';

const sample = {
  id: 1,
  text: 'What is 2+2?',
  answers: ['1', '2', '4', '3'],
  correct: 2,
} as any;

describe('Question', () => {
  it('renders question and calls onQuestionButtonClick with selected index', () => {
    const onClick = jest.fn();
    render(
      <Question data={sample} hasButton={true} onQuestionButtonClick={onClick} buttonText="Next" />,
    );

    // select third option (index 2 -> value q1-2)
    const input = screen.getByDisplayValue('q1-2') as HTMLInputElement;
    fireEvent.click(input);
    expect(input.checked).toBe(true);

    const btn = screen.getByText('Next');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledWith(2, sample);
  });
});
