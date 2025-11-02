'use client';

import { useTranslation } from '@/i18n/useTranslation';

export default function LocaleSwitcher(): React.ReactElement {
  const { locale, setLocale } = useTranslation();

  return (
    <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 9999 }}>
      <button
        onClick={() => setLocale('de')}
        aria-pressed={locale === 'de'}
        style={{ marginRight: 6 }}
      >
        DE
      </button>
      <button onClick={() => setLocale('en')} aria-pressed={locale === 'en'}>
        EN
      </button>
    </div>
  );
}
