/**
 * Anti-Cheat System for Quiz App
 * Detects and prevents various cheating attempts
 */

import { SecurityEventType, SecurityLevel, SecurityMonitor } from './security-monitor';

export enum CheatType {
  TAB_SWITCH = 'TAB_SWITCH',
  SUSPICIOUS_SPEED = 'SUSPICIOUS_SPEED',
  PATTERN_DETECTION = 'PATTERN_DETECTION',
  COPY_ATTEMPT = 'COPY_ATTEMPT',
  PASTE_ATTEMPT = 'PASTE_ATTEMPT',
  CONTEXT_MENU = 'CONTEXT_MENU',
  DEVELOPER_TOOLS = 'DEVELOPER_TOOLS',
  MULTIPLE_SESSIONS = 'MULTIPLE_SESSIONS',
}

export interface CheatEvent {
  type: CheatType;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface QuizSession {
  sessionId: string;
  startTime: number;
  tabSwitches: number;
  suspiciousEvents: CheatEvent[];
  answerTimings: number[];
  lastActivityTime: number;
}

export class AntiCheat {
  private static session: QuizSession | null = null;
  private static listeners: ((event: CheatEvent) => void)[] = [];
  private static isMonitoring = false;

  // Thresholds
  private static readonly MIN_ANSWER_TIME_MS = 1000; // Suspiciously fast if < 1s
  private static readonly MAX_TAB_SWITCHES = 3; // Maximum allowed tab switches
  private static readonly SUSPICION_THRESHOLD = 5; // Number of events before flagging

  /**
   * Initialize anti-cheat monitoring
   */
  static initialize(sessionId: string): QuizSession {
    this.session = {
      sessionId,
      startTime: Date.now(),
      tabSwitches: 0,
      suspiciousEvents: [],
      answerTimings: [],
      lastActivityTime: Date.now(),
    };

    if (typeof window !== 'undefined' && !this.isMonitoring) {
      this.startMonitoring();
      this.isMonitoring = true;
    }

    SecurityMonitor.log(
      SecurityEventType.QUIZ_STARTED,
      SecurityLevel.INFO,
      'Anti-cheat monitoring initialized',
      { sessionId },
    );

    return this.session;
  }

  /**
   * Start monitoring for cheating attempts
   */
  private static startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Prevent copying
    document.addEventListener('copy', this.handleCopy.bind(this));

    // Prevent pasting
    document.addEventListener('paste', this.handlePaste.bind(this));

    // Prevent right-click context menu
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));

    // Detect DevTools (partial detection)
    this.detectDevTools();

    // Monitor for suspicious keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring() {
    if (typeof window === 'undefined') return;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    document.removeEventListener('copy', this.handleCopy.bind(this));
    document.removeEventListener('paste', this.handlePaste.bind(this));
    document.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));

    this.isMonitoring = false;
  }

  /**
   * Handle visibility change (tab switching)
   */
  private static handleVisibilityChange() {
    if (document.hidden && this.session) {
      this.session.tabSwitches++;

      const event: CheatEvent = {
        type: CheatType.TAB_SWITCH,
        timestamp: Date.now(),
        severity: this.session.tabSwitches > this.MAX_TAB_SWITCHES ? 'high' : 'medium',
        metadata: {
          totalSwitches: this.session.tabSwitches,
        },
      };

      this.logCheatEvent(event);

      SecurityMonitor.log(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        this.session.tabSwitches > this.MAX_TAB_SWITCHES
          ? SecurityLevel.CRITICAL
          : SecurityLevel.WARNING,
        'Tab switch detected',
        {
          tabSwitches: this.session.tabSwitches,
          sessionId: this.session.sessionId,
        },
      );
    }
  }

  /**
   * Handle copy attempts
   */
  private static handleCopy(e: ClipboardEvent) {
    e.preventDefault();

    const event: CheatEvent = {
      type: CheatType.COPY_ATTEMPT,
      timestamp: Date.now(),
      severity: 'medium',
    };

    this.logCheatEvent(event);

    SecurityMonitor.log(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityLevel.WARNING,
      'Copy attempt detected',
    );
  }

  /**
   * Handle paste attempts
   */
  private static handlePaste(e: ClipboardEvent) {
    e.preventDefault();

    const event: CheatEvent = {
      type: CheatType.PASTE_ATTEMPT,
      timestamp: Date.now(),
      severity: 'low',
    };

    this.logCheatEvent(event);

    SecurityMonitor.log(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityLevel.WARNING,
      'Paste attempt detected',
    );
  }

  /**
   * Handle context menu (right-click)
   */
  private static handleContextMenu(e: MouseEvent) {
    e.preventDefault();

    const event: CheatEvent = {
      type: CheatType.CONTEXT_MENU,
      timestamp: Date.now(),
      severity: 'low',
    };

    this.logCheatEvent(event);
  }

  /**
   * Handle keyboard shortcuts
   */
  private static handleKeyDown(e: KeyboardEvent) {
    // Detect common developer tool shortcuts
    const isDev =
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      e.key === 'F12';

    if (isDev) {
      const event: CheatEvent = {
        type: CheatType.DEVELOPER_TOOLS,
        timestamp: Date.now(),
        severity: 'high',
        metadata: {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
        },
      };

      this.logCheatEvent(event);

      SecurityMonitor.log(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecurityLevel.CRITICAL,
        'Developer tools shortcut detected',
        event.metadata,
      );
    }
  }

  /**
   * Detect developer tools (simple detection)
   */
  private static detectDevTools() {
    if (typeof window === 'undefined') return;

    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      const event: CheatEvent = {
        type: CheatType.DEVELOPER_TOOLS,
        timestamp: Date.now(),
        severity: 'high',
      };

      this.logCheatEvent(event);

      SecurityMonitor.log(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecurityLevel.CRITICAL,
        'Developer tools possibly open',
      );
    }
  }

  /**
   * Record answer timing
   */
  static recordAnswerTiming(questionId: number, timeSpent: number) {
    if (!this.session) return;

    this.session.answerTimings.push(timeSpent);
    this.session.lastActivityTime = Date.now();

    // Check for suspiciously fast answers
    if (timeSpent < this.MIN_ANSWER_TIME_MS) {
      const event: CheatEvent = {
        type: CheatType.SUSPICIOUS_SPEED,
        timestamp: Date.now(),
        severity: 'high',
        metadata: {
          questionId,
          timeSpent,
          threshold: this.MIN_ANSWER_TIME_MS,
        },
      };

      this.logCheatEvent(event);

      SecurityMonitor.log(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecurityLevel.WARNING,
        'Suspiciously fast answer detected',
        event.metadata,
      );
    }
  }

  /**
   * Analyze answer patterns for suspicious behavior
   */
  static analyzeAnswerPattern(answers: Record<number, number | null>): boolean {
    if (!this.session) return false;

    const values = Object.values(answers).filter((v) => v !== null);

    // Check for all same answers (e.g., all A's)
    const allSame = values.length > 3 && values.every((v) => v === values[0]);

    // Check for sequential pattern (0,1,2,3... or 3,2,1,0...)
    const isSequential =
      values.length > 3 &&
      (values.every((v, i) => i === 0 || v === values[i - 1]! + 1) ||
        values.every((v, i) => i === 0 || v === values[i - 1]! - 1));

    if (allSame || isSequential) {
      const event: CheatEvent = {
        type: CheatType.PATTERN_DETECTION,
        timestamp: Date.now(),
        severity: 'high',
        metadata: {
          pattern: allSame ? 'all-same' : 'sequential',
          answers: values,
        },
      };

      this.logCheatEvent(event);

      SecurityMonitor.log(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecurityLevel.CRITICAL,
        'Suspicious answer pattern detected',
        event.metadata,
      );

      return true;
    }

    return false;
  }

  /**
   * Log cheat event
   */
  private static logCheatEvent(event: CheatEvent) {
    if (!this.session) return;

    this.session.suspiciousEvents.push(event);
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Get current session
   */
  static getSession(): QuizSession | null {
    return this.session ? { ...this.session } : null;
  }

  /**
   * Get suspicion score (0-100)
   */
  static getSuspicionScore(): number {
    if (!this.session) return 0;

    let score = 0;

    // Tab switches (up to 30 points)
    score += Math.min(this.session.tabSwitches * 10, 30);

    // Suspicious events by severity
    this.session.suspiciousEvents.forEach((event) => {
      if (event.severity === 'high') score += 20;
      else if (event.severity === 'medium') score += 10;
      else score += 5;
    });

    return Math.min(score, 100);
  }

  /**
   * Check if session is suspicious
   */
  static isSuspicious(): boolean {
    return this.getSuspicionScore() >= 50;
  }

  /**
   * Add event listener
   */
  static addEventListener(listener: (event: CheatEvent) => void) {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  static removeEventListener(listener: (event: CheatEvent) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Reset session
   */
  static reset() {
    this.stopMonitoring();
    this.session = null;
    this.listeners = [];
    this.isMonitoring = false;
  }

  /**
   * Get session report for submission
   */
  static getSessionReport() {
    if (!this.session) return null;

    return {
      sessionId: this.session.sessionId,
      duration: Date.now() - this.session.startTime,
      tabSwitches: this.session.tabSwitches,
      suspiciousEvents: this.session.suspiciousEvents.length,
      suspicionScore: this.getSuspicionScore(),
      isSuspicious: this.isSuspicious(),
      averageAnswerTime:
        this.session.answerTimings.length > 0
          ? this.session.answerTimings.reduce((a, b) => a + b, 0) /
            this.session.answerTimings.length
          : 0,
      events: this.session.suspiciousEvents,
    };
  }
}
