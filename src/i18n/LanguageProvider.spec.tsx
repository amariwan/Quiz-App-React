import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

// Import the provider and hook
import { LanguageProvider, useI18n } from './LanguageProvider';

function Consumer() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="title">{t('intro.title')}</div>
      <div data-testid="desc">{t('intro.desc', { count: 5 })}</div>
      <button onClick={() => setLocale('en')}>set-en</button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    // clear localStorage and reset lang
    window.localStorage.clear();
    document.documentElement.lang = '';
  });

  it('uses saved locale from localStorage when present', () => {
    window.localStorage.setItem('locale', 'en');

    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('title')).toHaveTextContent(/Flashcards AP Part 1/i);
    // document.lang should be set via effect
    expect(document.documentElement.lang).toBe('en');
  });

  it('interpolates variables and updates locale via setLocale', () => {
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>,
    );

    // default locale is de in the provider; description should include the number
    expect(screen.getByTestId('desc')).toHaveTextContent(/5/);

    // switch to English via consumer button
    act(() => {
      screen.getByText('set-en').click();
    });

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    // localStorage should have been updated
    expect(window.localStorage.getItem('locale')).toBe('en');
    // t now returns English title
    expect(screen.getByTestId('title')).toHaveTextContent(/Flashcards AP Part 1/i);
  });
});
