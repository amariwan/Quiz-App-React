'use client';

import React from 'react';
import { useQuizGame } from '@/app/hooks/useQuizGame';
import QuizScreen from '@/ui/QuizScreen';
import { useTranslation } from '@/i18n/useTranslation';

export default function Page() {
  const { t } = useTranslation();
  const controller = useQuizGame();

  return <QuizScreen t={t} {...controller} />;
}
