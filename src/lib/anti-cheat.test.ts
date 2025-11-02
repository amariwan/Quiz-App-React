/**
 * Anti-Cheat System Tests
 */

import { AntiCheat, CheatType } from './anti-cheat';

describe('AntiCheat System', () => {
  beforeEach(() => {
    AntiCheat.reset();
  });

  afterEach(() => {
    AntiCheat.reset();
  });

  describe('Session Management', () => {
    it('should initialize a new session', () => {
      const sessionId = 'test-session-123';
      const session = AntiCheat.initialize(sessionId);

      expect(session).toBeDefined();
      expect(session.sessionId).toBe(sessionId);
      expect(session.tabSwitches).toBe(0);
      expect(session.suspiciousEvents).toHaveLength(0);
      expect(session.answerTimings).toHaveLength(0);
    });

    it('should get current session', () => {
      const sessionId = 'test-session-456';
      AntiCheat.initialize(sessionId);

      const session = AntiCheat.getSession();
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should reset session', () => {
      AntiCheat.initialize('test-session');
      AntiCheat.reset();

      const session = AntiCheat.getSession();
      expect(session).toBeNull();
    });
  });

  describe('Answer Timing', () => {
    it('should record answer timings', () => {
      AntiCheat.initialize('test-session');

      AntiCheat.recordAnswerTiming(1, 5000);
      AntiCheat.recordAnswerTiming(2, 3000);

      const session = AntiCheat.getSession();
      expect(session?.answerTimings).toEqual([5000, 3000]);
    });

    it('should detect suspiciously fast answers', () => {
      AntiCheat.initialize('test-session');

      const listener = jest.fn();
      AntiCheat.addEventListener(listener);

      // Answer in less than 1 second (suspicious)
      AntiCheat.recordAnswerTiming(1, 500);

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0];
      expect(event.type).toBe(CheatType.SUSPICIOUS_SPEED);
      expect(event.severity).toBe('high');
    });

    it('should not flag normal answer times', () => {
      AntiCheat.initialize('test-session');

      const listener = jest.fn();
      AntiCheat.addEventListener(listener);

      // Normal answer time
      AntiCheat.recordAnswerTiming(1, 5000);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Answer Pattern Detection', () => {
    it('should detect all same answers', () => {
      AntiCheat.initialize('test-session');

      const answers = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
      };

      const isSuspicious = AntiCheat.analyzeAnswerPattern(answers);
      expect(isSuspicious).toBe(true);

      const session = AntiCheat.getSession();
      const patternEvent = session?.suspiciousEvents.find(
        (e) => e.type === CheatType.PATTERN_DETECTION,
      );
      expect(patternEvent).toBeDefined();
      expect(patternEvent?.metadata?.pattern).toBe('all-same');
    });

    it('should detect sequential patterns (ascending)', () => {
      AntiCheat.initialize('test-session');

      const answers = {
        1: 0,
        2: 1,
        3: 2,
        4: 3,
      };

      const isSuspicious = AntiCheat.analyzeAnswerPattern(answers);
      expect(isSuspicious).toBe(true);

      const session = AntiCheat.getSession();
      const patternEvent = session?.suspiciousEvents.find(
        (e) => e.type === CheatType.PATTERN_DETECTION,
      );
      expect(patternEvent?.metadata?.pattern).toBe('sequential');
    });

    it('should detect sequential patterns (descending)', () => {
      AntiCheat.initialize('test-session');

      const answers = {
        1: 3,
        2: 2,
        3: 1,
        4: 0,
      };

      const isSuspicious = AntiCheat.analyzeAnswerPattern(answers);
      expect(isSuspicious).toBe(true);
    });

    it('should not flag normal answer patterns', () => {
      AntiCheat.initialize('test-session');

      const answers = {
        1: 0,
        2: 2,
        3: 1,
        4: 3,
      };

      const isSuspicious = AntiCheat.analyzeAnswerPattern(answers);
      expect(isSuspicious).toBe(false);
    });

    it('should not flag patterns with null values', () => {
      AntiCheat.initialize('test-session');

      const answers = {
        1: 0,
        2: null,
        3: 0,
        4: 0,
      };

      const isSuspicious = AntiCheat.analyzeAnswerPattern(answers);
      expect(isSuspicious).toBe(false);
    });
  });

  describe('Suspicion Score', () => {
    it('should calculate suspicion score correctly', () => {
      AntiCheat.initialize('test-session');

      // Simulate multiple suspicious events
      AntiCheat.recordAnswerTiming(1, 500); // High severity: +20
      AntiCheat.recordAnswerTiming(2, 500); // High severity: +20

      const score = AntiCheat.getSuspicionScore();
      expect(score).toBeGreaterThanOrEqual(40);
    });

    it('should cap suspicion score at 100', () => {
      AntiCheat.initialize('test-session');

      // Create many suspicious events
      for (let i = 0; i < 10; i++) {
        AntiCheat.recordAnswerTiming(i, 500);
      }

      const score = AntiCheat.getSuspicionScore();
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should flag session as suspicious above threshold', () => {
      AntiCheat.initialize('test-session');

      // Create enough events to exceed 50 points
      for (let i = 0; i < 3; i++) {
        AntiCheat.recordAnswerTiming(i, 500); // 60 points total
      }

      expect(AntiCheat.isSuspicious()).toBe(true);
    });

    it('should not flag low-score sessions as suspicious', () => {
      AntiCheat.initialize('test-session');

      AntiCheat.recordAnswerTiming(1, 5000); // Normal timing

      expect(AntiCheat.isSuspicious()).toBe(false);
    });
  });

  describe('Session Report', () => {
    it('should generate comprehensive session report', () => {
      const sessionId = 'test-session-report';
      AntiCheat.initialize(sessionId);

      // Simulate quiz activity
      AntiCheat.recordAnswerTiming(1, 5000);
      AntiCheat.recordAnswerTiming(2, 3000);
      AntiCheat.recordAnswerTiming(3, 500); // Suspicious

      const report = AntiCheat.getSessionReport();

      expect(report).toBeDefined();
      expect(report?.sessionId).toBe(sessionId);
      expect(report?.duration).toBeGreaterThanOrEqual(0);
      expect(report?.suspiciousEvents).toBeGreaterThan(0);
      expect(report?.averageAnswerTime).toBeGreaterThan(0);
      expect(report?.events).toBeInstanceOf(Array);
    });

    it('should return null report when no session exists', () => {
      const report = AntiCheat.getSessionReport();
      expect(report).toBeNull();
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners of cheat events', () => {
      AntiCheat.initialize('test-session');

      const listener1 = jest.fn();
      const listener2 = jest.fn();

      AntiCheat.addEventListener(listener1);
      AntiCheat.addEventListener(listener2);

      AntiCheat.recordAnswerTiming(1, 500);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      AntiCheat.initialize('test-session');

      const listener = jest.fn();
      AntiCheat.addEventListener(listener);
      AntiCheat.removeEventListener(listener);

      AntiCheat.recordAnswerTiming(1, 500);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
