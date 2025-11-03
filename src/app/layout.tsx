import { ErrorBoundary } from '@/components';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import '@/styles/style.css';
import type React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
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
