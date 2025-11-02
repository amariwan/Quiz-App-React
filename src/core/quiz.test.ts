/* eslint-disable @typescript-eslint/no-explicit-any */
import { questions } from '@/data/questions';
import { computeResults, getPublicQuestions } from './quiz';

describe('core quiz helpers', () => {
  test('getPublicQuestions hides correct index', () => {
    const pub = getPublicQuestions(questions as any);
    expect(Array.isArray(pub)).toBe(true);
    expect(pub.length).toBeGreaterThan(0);
    expect((pub[0] as any).correct).toBeUndefined();
  });

  test('computeResults returns score and results shape', () => {
    const selections = { '1': 1, '2': null };
    const { score, results } = computeResults(questions as any, selections as any);
    expect(typeof score).toBe('number');
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('isCorrect');
  });
});
