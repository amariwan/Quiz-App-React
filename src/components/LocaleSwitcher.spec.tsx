import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockSetLocale = jest.fn();

jest.mock('@/i18n/useTranslation', () => ({
  useTranslation: () => ({
    locale: 'en',
    setLocale: mockSetLocale,
  }),
}));

import LocaleSwitcher from './LocaleSwitcher';

describe('LocaleSwitcher', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders two buttons and toggles locale via setLocale', () => {
    render(<LocaleSwitcher />);

    const de = screen.getByText('DE');
    const en = screen.getByText('EN');

    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(de).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(de);
    expect(mockSetLocale).toHaveBeenCalledWith('de');
  });
});
