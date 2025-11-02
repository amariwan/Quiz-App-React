import { ErrorBoundary } from '@/components';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import '@/css/style.css';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import type React from 'react';

export const metadata = {
  title: 'Quiz App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <ErrorBoundary>
          <LanguageProvider>
            <LocaleSwitcher />
            {children}
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
