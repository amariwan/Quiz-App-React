import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const translations: Record<string, string> = {
  'results.correct': 'Correct',
  'results.wrong': 'Wrong',
  'results.empty': 'Empty',
};

jest.mock('@/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (k: string) => translations[k] ?? k }),
}));

import Results from './Results';

describe('Results', () => {
  it('renders counts and translated labels', () => {
    render(<Results wrong={2} correct={5} empty={1} />);

    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();

    expect(screen.getByText(/Correct/i)).toBeDefined();
    expect(screen.getByText(/Wrong/i)).toBeDefined();
    expect(screen.getByText(/Empty/i)).toBeDefined();
  });
});
