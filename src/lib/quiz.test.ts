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
    const dataset = [
      { id: 0, text: 'Q0', answers: ['a', 'b'], correct: 0 },
      { id: 1, text: 'Q1', answers: ['a', 'b'], correct: 1 },
      { id: 2, text: 'Q2', answers: ['a', 'b'], correct: 0 },
    ];
    const selections = { '0': 0, '1': 0, '2': null };
    const { score, results } = computeResults(dataset as any, selections as any);
    expect(Array.isArray(results)).toBe(true);
    expect(score).toBe(1);
    const q0 = results.find((r: any) => r.id === 0);
    expect(q0?.isCorrect).toBe(true);
    const q1 = results.find((r: any) => r.id === 1);
    expect(q1?.isCorrect).toBe(false);
    const q2 = results.find((r: any) => r.id === 2);
    expect(q2?.selection).toBeNull();
  });
});
