/**
 * Tests for Security Monitor
 */

import {
  InputValidator,
  RateLimiter,
  SecurityEventType,
  SecurityLevel,
  SecurityMonitor,
} from './security-monitor';

describe('SecurityMonitor', () => {
  beforeEach(() => {
    SecurityMonitor.clearEvents();
  });

  describe('Event Logging', () => {
    it('should log security events', () => {
      const event = SecurityMonitor.log(
        SecurityEventType.QUIZ_STARTED,
        SecurityLevel.INFO,
        'Test event',
      );

      expect(event).toBeDefined();
      expect(event.type).toBe(SecurityEventType.QUIZ_STARTED);
      expect(event.level).toBe(SecurityLevel.INFO);
      expect(event.message).toBe('Test event');
    });

    it('should include metadata in events', () => {
      const metadata = { userId: 123, action: 'test' };
      const event = SecurityMonitor.log(
        SecurityEventType.API_REQUEST,
        SecurityLevel.INFO,
        'API called',
        metadata,
      );

      expect(event.metadata).toBeDefined();
      expect(event.metadata?.userId).toBe(123);
      expect(event.metadata?.action).toBe('test');
    });

    it('should generate unique event IDs', () => {
      const event1 = SecurityMonitor.log(
        SecurityEventType.QUIZ_STARTED,
        SecurityLevel.INFO,
        'Event 1',
      );
      const event2 = SecurityMonitor.log(
        SecurityEventType.QUIZ_STARTED,
        SecurityLevel.INFO,
        'Event 2',
      );

      expect(event1.id).not.toBe(event2.id);
    });

    it('should include timestamp', () => {
      const before = new Date().toISOString();
      const event = SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Test');
      const after = new Date().toISOString();

      expect(event.timestamp).toBeDefined();
      expect(event.timestamp >= before).toBe(true);
      expect(event.timestamp <= after).toBe(true);
    });
  });

  describe('Event Retrieval', () => {
    beforeEach(() => {
      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Info 1');
      SecurityMonitor.log(SecurityEventType.ERROR_OCCURRED, SecurityLevel.CRITICAL, 'Error 1');
      SecurityMonitor.log(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecurityLevel.WARNING,
        'Warning 1',
      );
      SecurityMonitor.log(SecurityEventType.QUIZ_SUBMITTED, SecurityLevel.INFO, 'Info 2');
    });

    it('should retrieve all events', () => {
      const events = SecurityMonitor.getEvents();
      expect(events.length).toBe(4);
    });

    it('should filter events by type', () => {
      const quizEvents = SecurityMonitor.getEventsByType(SecurityEventType.QUIZ_STARTED);
      expect(quizEvents.length).toBe(1);
      expect(quizEvents[0].message).toBe('Info 1');
    });

    it('should filter events by level', () => {
      const criticalEvents = SecurityMonitor.getEventsByLevel(SecurityLevel.CRITICAL);
      expect(criticalEvents.length).toBe(1);
      expect(criticalEvents[0].message).toBe('Error 1');

      const infoEvents = SecurityMonitor.getEventsByLevel(SecurityLevel.INFO);
      expect(infoEvents.length).toBe(2);
    });

    it('should get recent events', () => {
      const recent = SecurityMonitor.getRecentEvents(2);
      expect(recent.length).toBe(2);
      expect(recent[1].message).toBe('Info 2'); // Most recent
    });
  });

  describe('Event Summary', () => {
    beforeEach(() => {
      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Info 1');
      SecurityMonitor.log(SecurityEventType.ERROR_OCCURRED, SecurityLevel.CRITICAL, 'Error 1');
      SecurityMonitor.log(SecurityEventType.ERROR_OCCURRED, SecurityLevel.CRITICAL, 'Error 2');
      SecurityMonitor.log(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecurityLevel.WARNING,
        'Warning 1',
      );
    });

    it('should generate correct summary', () => {
      const summary = SecurityMonitor.getSummary();

      expect(summary.totalEvents).toBe(4);
      expect(summary.criticalCount).toBe(2);
      expect(summary.warningCount).toBe(1);
      expect(summary.infoCount).toBe(1);
      expect(summary.recentCritical.length).toBe(2);
    });
  });

  describe('Event Export', () => {
    it('should export events as JSON', () => {
      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Test');
      const exported = SecurityMonitor.exportEvents();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });
  });

  describe('Event Subscription', () => {
    it('should notify subscribers of new events', () => {
      const callback = jest.fn();
      const unsubscribe = SecurityMonitor.subscribe(callback);

      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Test');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].message).toBe('Test');

      unsubscribe();
    });

    it('should allow unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = SecurityMonitor.subscribe(callback);

      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Test 1');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, 'Test 2');
      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('Event Limit', () => {
    it('should limit stored events', () => {
      // Create more than maxEvents (1000)
      for (let i = 0; i < 1100; i++) {
        SecurityMonitor.log(SecurityEventType.QUIZ_STARTED, SecurityLevel.INFO, `Event ${i}`);
      }

      const events = SecurityMonitor.getEvents();
      expect(events.length).toBe(1000);
      expect(events[events.length - 1].message).toBe('Event 1099');
    });
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    RateLimiter.clearAll();
  });

  it('should allow requests within limit', () => {
    const identifier = 'test-user';

    for (let i = 0; i < 10; i++) {
      expect(RateLimiter.isAllowed(identifier)).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    const identifier = 'test-user';

    // Fill up to limit
    for (let i = 0; i < 10; i++) {
      RateLimiter.isAllowed(identifier);
    }

    // Should be blocked
    expect(RateLimiter.isAllowed(identifier)).toBe(false);
  });

  it('should reset after time window', () => {
    jest.useFakeTimers();
    const identifier = 'test-user';

    // Fill up to limit
    for (let i = 0; i < 10; i++) {
      RateLimiter.isAllowed(identifier);
    }

    expect(RateLimiter.isAllowed(identifier)).toBe(false);

    // Fast forward past window
    jest.advanceTimersByTime(61000);

    // Should be allowed again
    expect(RateLimiter.isAllowed(identifier)).toBe(true);

    jest.useRealTimers();
  });

  it('should track different identifiers separately', () => {
    for (let i = 0; i < 10; i++) {
      RateLimiter.isAllowed('user1');
    }

    expect(RateLimiter.isAllowed('user1')).toBe(false);
    expect(RateLimiter.isAllowed('user2')).toBe(true);
  });

  it('should reset specific identifier', () => {
    const identifier = 'test-user';

    for (let i = 0; i < 10; i++) {
      RateLimiter.isAllowed(identifier);
    }

    expect(RateLimiter.isAllowed(identifier)).toBe(false);

    RateLimiter.reset(identifier);

    expect(RateLimiter.isAllowed(identifier)).toBe(true);
  });
});

describe('InputValidator', () => {
  describe('Selections Validation', () => {
    it('should validate correct selections', () => {
      const validSelections = {
        1: 0,
        2: 1,
        3: null,
      };

      expect(InputValidator.validateSelections(validSelections)).toBe(true);
    });

    it('should reject non-object selections', () => {
      expect(InputValidator.validateSelections(null)).toBe(false);
      expect(InputValidator.validateSelections(undefined)).toBe(false);
      expect(InputValidator.validateSelections('string')).toBe(false);
      expect(InputValidator.validateSelections(123)).toBe(false);
    });

    it('should reject invalid selection values', () => {
      const invalidSelections = {
        1: 'string',
        2: 1,
      };

      expect(InputValidator.validateSelections(invalidSelections)).toBe(false);
    });

    it('should allow null values', () => {
      const selections = {
        1: null,
        2: 0,
      };

      expect(InputValidator.validateSelections(selections)).toBe(true);
    });
  });

  describe('String Sanitization', () => {
    it('should remove dangerous characters', () => {
      const dangerous = '<script>alert("XSS")</script>';
      const sanitized = InputValidator.sanitizeString(dangerous);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain("'");
    });

    it('should preserve safe characters', () => {
      const safe = 'Hello World 123 !@#$%^&*()';
      const sanitized = InputValidator.sanitizeString(safe);

      expect(sanitized).toContain('Hello World 123');
    });
  });
});
