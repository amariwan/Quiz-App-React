/**
 * Security Monitoring and Audit System
 */

import { SelectionsMap } from '@/types';

export enum SecurityEventType {
  ENCRYPTION_KEY_GENERATED = 'ENCRYPTION_KEY_GENERATED',
  DATA_ENCRYPTED = 'DATA_ENCRYPTED',
  DATA_DECRYPTED = 'DATA_DECRYPTED',
  API_REQUEST = 'API_REQUEST',
  QUIZ_STARTED = 'QUIZ_STARTED',
  QUIZ_SUBMITTED = 'QUIZ_SUBMITTED',
  AUTHENTICATION_ATTEMPT = 'AUTHENTICATION_ATTEMPT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
}

export enum SecurityLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  level: SecurityLevel;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static maxEvents = 1000;
  private static listeners: ((event: SecurityEvent) => void)[] = [];

  /**
   * Log a security event
   */
  static log(
    type: SecurityEventType,
    level: SecurityLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type,
      level,
      message,
      metadata: {
        ...metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      },
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(event));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${level}] ${type}:`;
      if (level === SecurityLevel.CRITICAL) {
        console.error(prefix, message, metadata);
      } else if (level === SecurityLevel.WARNING) {
        console.warn(prefix, message, metadata);
      } else {
        // Use warn for info-level logs to comply with allowed console methods
        console.warn(prefix, message, metadata);
      }
    }

    return event;
  }

  /**
   * Get all events
   */
  static getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  static getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get events by level
   */
  static getEventsByLevel(level: SecurityLevel): SecurityEvent[] {
    return this.events.filter((e) => e.level === level);
  }

  /**
   * Get recent events
   */
  static getRecentEvents(count: number = 100): SecurityEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Clear all events
   */
  static clearEvents(): void {
    this.events = [];
  }

  /**
   * Subscribe to events
   */
  static subscribe(listener: (event: SecurityEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Export events for audit
   */
  static exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Get security summary
   */
  static getSummary(): {
    totalEvents: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    recentCritical: SecurityEvent[];
  } {
    const criticalEvents = this.getEventsByLevel(SecurityLevel.CRITICAL);
    const warningEvents = this.getEventsByLevel(SecurityLevel.WARNING);
    const infoEvents = this.getEventsByLevel(SecurityLevel.INFO);

    return {
      totalEvents: this.events.length,
      criticalCount: criticalEvents.length,
      warningCount: warningEvents.length,
      infoCount: infoEvents.length,
      recentCritical: criticalEvents.slice(-10),
    };
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Rate Limiter for API protection
 */
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static readonly MAX_REQUESTS = 10;
  private static readonly WINDOW_MS = 60000; // 1 minute

  /**
   * Check if request is allowed
   */
  static isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    if (record.count >= this.MAX_REQUESTS) {
      SecurityMonitor.log(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecurityLevel.WARNING,
        `Rate limit exceeded for ${identifier}`,
        { identifier, count: record.count },
      );
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Reset rate limit for identifier
   */
  static reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  static clearAll(): void {
    this.requests.clear();
  }
}

/**
 * Input Validation Helper
 */
export class InputValidator {
  /**
   * Validate selections object
   */
  static validateSelections(selections: SelectionsMap): boolean {
    if (!selections || typeof selections !== 'object') {
      SecurityMonitor.log(
        SecurityEventType.VALIDATION_FAILED,
        SecurityLevel.WARNING,
        'Invalid selections format',
        { selections },
      );
      return false;
    }

    for (const [key, value] of Object.entries(selections)) {
      if (typeof key !== 'string' && typeof key !== 'number') {
        SecurityMonitor.log(
          SecurityEventType.VALIDATION_FAILED,
          SecurityLevel.WARNING,
          'Invalid selection key',
          { key },
        );
        return false;
      }

      if (value !== null && typeof value !== 'number') {
        SecurityMonitor.log(
          SecurityEventType.VALIDATION_FAILED,
          SecurityLevel.WARNING,
          'Invalid selection value',
          { value },
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.replace(/[<>'"]/g, '');
  }
}
