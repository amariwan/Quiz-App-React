import { useCallback, useEffect, useRef, useState } from 'react';

type UseTimerOptions = {
  initial?: number; // seconds
  tickMs?: number;
};

const DEFAULT_TICK_MS = 1000;

export function useTimer({ initial = 0, tickMs = DEFAULT_TICK_MS }: UseTimerOptions = {}): {
  seconds: number;
  running: boolean;
  start: () => void;
  stop: () => void;
  reset: (_to?: number) => void;
  setSeconds: (_v: number) => void;
} {
  const [seconds, setSeconds] = useState<number>(initial);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const safeTickMs = Number.isFinite(tickMs) && tickMs > 0 ? tickMs : DEFAULT_TICK_MS;
  const tickStep = safeTickMs / 1000;

  const start = useCallback(() => setRunning(true), []);
  const stop = useCallback(() => setRunning(false), []);
  const reset = useCallback((to = initial) => setSeconds(to), [initial]);

  // cleanup on unmount
  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        const next = s + tickStep;
        return Number.isFinite(next) ? Number(next.toFixed(3)) : s;
      });
    }, safeTickMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, safeTickMs, tickStep]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    seconds,
    running,
    start,
    stop,
    reset,
    setSeconds,
  } as const;
}
