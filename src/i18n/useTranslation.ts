import { useI18n } from './LanguageProvider';

export function useTranslation(): ReturnType<typeof useI18n> {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}
