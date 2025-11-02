/**
 * Anti-Cheat Warning Component
 * Displays warnings when suspicious activity is detected
 */

'use client';

import { AntiCheat, CheatEvent, CheatType } from '@/lib/anti-cheat';
import { useEffect, useState } from 'react';

export default function AntiCheatWarning(): React.ReactElement | null {
  const [warnings, setWarnings] = useState<CheatEvent[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [suspicionScore, setSuspicionScore] = useState(0);

  useEffect(() => {
    const handleCheatEvent = (event: CheatEvent) => {
      setWarnings((prev) => [...prev, event]);
      setShowWarning(true);
      setSuspicionScore(AntiCheat.getSuspicionScore());

      // Auto-hide after 5 seconds for low severity
      if (event.severity === 'low') {
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    AntiCheat.addEventListener(handleCheatEvent);

    return () => {
      AntiCheat.removeEventListener(handleCheatEvent);
    };
  }, []);

  const getWarningMessage = (type: CheatType): string => {
    switch (type) {
      case CheatType.TAB_SWITCH:
        return '⚠️ Tab switching detected. Please stay on this page during the quiz.';
      case CheatType.COPY_ATTEMPT:
        return '⚠️ Copying is disabled during the quiz.';
      case CheatType.PASTE_ATTEMPT:
        return '⚠️ Pasting is disabled during the quiz.';
      case CheatType.CONTEXT_MENU:
        return '⚠️ Right-click is disabled during the quiz.';
      case CheatType.DEVELOPER_TOOLS:
        return '⚠️ Developer tools detected. This may affect your quiz results.';
      case CheatType.SUSPICIOUS_SPEED:
        return '⚠️ Answer speed is being monitored.';
      case CheatType.PATTERN_DETECTION:
        return '⚠️ Unusual answer pattern detected.';
      default:
        return '⚠️ Suspicious activity detected.';
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'low':
        return '#ffc107';
      case 'medium':
        return '#ff9800';
      case 'high':
        return '#f44336';
      default:
        return '#ffc107';
    }
  };

  if (!showWarning || warnings.length === 0) return null;

  const latestWarning = warnings[warnings.length - 1];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        maxWidth: '400px',
        backgroundColor: getSeverityColor(latestWarning.severity),
        color: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        animation: 'slideIn 0.3s ease-out',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {latestWarning.severity === 'high' ? 'Security Alert!' : 'Warning'}
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            {getWarningMessage(latestWarning.type)}
          </div>
          {suspicionScore > 0 && (
            <div
              style={{
                fontSize: '12px',
                marginTop: '8px',
                opacity: 0.9,
              }}
            >
              Suspicion Score: {suspicionScore}/100
            </div>
          )}
        </div>
        <button
          onClick={() => setShowWarning(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            marginLeft: '10px',
            padding: '0',
            lineHeight: '1',
          }}
          aria-label="Close warning"
        >
          ×
        </button>
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
