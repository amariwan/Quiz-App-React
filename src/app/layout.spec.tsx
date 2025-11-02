/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock ErrorBoundary from components barrel
jest.mock('@/components', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock LocaleSwitcher default export
jest.mock('@/components/LocaleSwitcher', () => () => <div data-testid="locale-switcher">LS</div>);

// Mock LanguageProvider
jest.mock('@/i18n/LanguageProvider', () => ({
  LanguageProvider: ({ children }: any) => <div data-testid="language-provider">{children}</div>,
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('renders ErrorBoundary, LanguageProvider and LocaleSwitcher and children', () => {
    render(
      <RootLayout>
        <div>child-content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId('error-boundary')).toBeDefined();
    expect(screen.getByTestId('language-provider')).toBeDefined();
    expect(screen.getByTestId('locale-switcher')).toBeDefined();
    expect(screen.getByText('child-content')).toBeDefined();
  });
});
