import { SecureApiClient } from '@/lib/secure-api-client';
import { SecurityEventType, SecurityLevel, SecurityMonitor } from '@/lib/security-monitor';
import type { QuestionData } from '@/types';
import { useEffect, useState } from 'react';

type QuestionsResponse = {
  questions?: QuestionData[];
};

export default function useQuestions(): {
  questions: QuestionData[] | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  setQuestions: (questions: QuestionData[]) => void;
} {
  const [questions, setQuestions] = useState<QuestionData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      SecurityMonitor.log(
        SecurityEventType.API_REQUEST,
        SecurityLevel.INFO,
        'Loading questions with encryption',
      );

      const json = (await SecureApiClient.fetchQuestions()) as QuestionsResponse;
      setQuestions(Array.isArray(json.questions) ? json.questions : []);

      SecurityMonitor.log(
        SecurityEventType.API_REQUEST,
        SecurityLevel.INFO,
        'Questions loaded successfully',
        { count: json.questions?.length || 0 },
      );
    } catch (err) {
      SecurityMonitor.log(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.CRITICAL,
        'Failed to load questions',
        { error: String(err) },
      );
      setError(err as Error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { questions, loading, error, reload: load, setQuestions } as const;
}
