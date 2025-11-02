'use client';

import { useQuizGame } from '@/app/hooks/useQuizGame';
import { useTranslation } from '@/i18n/useTranslation';
import QuizScreen from '@/ui/QuizScreen';
import React from 'react';

export default function Page(): React.ReactElement {
  const { t } = useTranslation();
  const controller = useQuizGame();

  return <QuizScreen t={t} {...controller} />;
}
