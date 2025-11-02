/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import type { QuestionData } from '@/types';
import { useQuizState } from './useQuizState';

const sampleQuestions: QuestionData[] = [
  { id: 1, text: 'Q1', answers: ['a', 'b'], correct: 0 },
  { id: 2, text: 'Q2', answers: ['a', 'b'], correct: 1 },
];

describe('useQuizState', () => {
  it('provides safe defaults for empty question lists', () => {
    const { result } = renderHook(() => useQuizState([]));

    expect(result.current.questions).toEqual([]);
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.results.score).toBe(0);
  });

  it('tracks selections and navigation', () => {
    const { result } = renderHook(() => useQuizState(sampleQuestions));

    act(() => {
      result.current.select(1, 0);
    });

    expect(result.current.selections['1']).toBe(0);
    expect(result.current.results.score).toBe(1);

    act(() => {
      result.current.next();
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.goTo(5);
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.prev();
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.reset();
    });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.selections).toEqual({});
  });
});
