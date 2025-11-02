import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>OK</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('OK')).toBeDefined();
  });

  it('shows fallback UI when child throws', () => {
    const orig = console.error;
    console.error = jest.fn();

    const Bomb = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Etwas ist schiefgelaufen/i)).toBeDefined();
    expect(screen.getByText(/Seite neu laden/i)).toBeDefined();

    // restore
    console.error = orig;
  });
});
