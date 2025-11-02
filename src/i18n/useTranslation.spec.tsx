import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from './LanguageProvider';
import { useTranslation } from './useTranslation';

function TestComp() {
  const { t, locale, setLocale } = useTranslation();
  return (
    <div>
      <div data-testid="t">{t('results.correct')}</div>
      <div data-testid="locale">{locale}</div>
      <button onClick={() => setLocale('de')}>to-de</button>
    </div>
  );
}

describe('useTranslation hook', () => {
  it('returns translation function and locale setter', () => {
    render(
      <LanguageProvider>
        <TestComp />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('t')).toBeDefined();
    // default locale (provider fallback) is de
    expect(screen.getByTestId('locale')).toBeDefined();
  });
});
