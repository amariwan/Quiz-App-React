import { questions } from '../data/questions';
import { computeResults, getPublicQuestions } from './quiz';

describe('quiz helpers', () => {
  test('getPublicQuestions removes correct answers', () => {
    const pub = getPublicQuestions(questions as any);
    expect(Array.isArray(pub)).toBe(true);
    expect(pub.length).toBeGreaterThan(0);
    // public question should not include the `correct` field
    expect((pub[0] as any).correct).toBeUndefined();
    expect((pub[0] as any).answers).toBeDefined();
  });

  test('computeResults computes score correctly', () => {
    const selections = { '0': 0, '1': 1, '2': null };
    const { score, results } = computeResults(questions as any, selections as any);
    expect(Array.isArray(results)).toBe(true);
    // From the data, correct indexes are 0 for all questions -> only q0 is correct
    expect(score).toBe(1);
    const q0 = results.find((r: any) => r.id === 0);
    expect(q0).toBeDefined();
    expect(q0!.isCorrect).toBe(true);
    const q1 = results.find((r: any) => r.id === 1);
    expect(q1).toBeDefined();
    expect(q1!.isCorrect).toBe(false);
  });
});
