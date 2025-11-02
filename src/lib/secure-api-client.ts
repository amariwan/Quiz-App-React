/**
 * Secure API Client with E2E Encryption
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { E2EEncryption } from './encryption';
import {
  RateLimiter,
  SecurityEvent,
  SecurityEventType,
  SecurityLevel,
  SecurityMonitor,
} from './security-monitor';

export class SecureApiClient {
  private static encryptionKey: CryptoKey | null = null;
  private static sessionId: string = '';

  /**
   * Initialize secure session
   */
  static async initializeSession(): Promise<void> {
    try {
      // Generate session ID
      this.sessionId = this.generateSessionId();

      // Generate or retrieve encryption key
      const storedKey = sessionStorage.getItem('quiz_encryption_key');
      if (storedKey) {
        this.encryptionKey = await E2EEncryption.importKey(storedKey);
        SecurityMonitor.log(
          SecurityEventType.ENCRYPTION_KEY_GENERATED,
          SecurityLevel.INFO,
          'Encryption key restored from session',
          { sessionId: this.sessionId },
        );
      } else {
        this.encryptionKey = await E2EEncryption.generateKey();
        const exportedKey = await E2EEncryption.exportKey(this.encryptionKey);
        sessionStorage.setItem('quiz_encryption_key', exportedKey);
        SecurityMonitor.log(
          SecurityEventType.ENCRYPTION_KEY_GENERATED,
          SecurityLevel.INFO,
          'New encryption key generated',
          { sessionId: this.sessionId },
        );
      }
    } catch (error) {
      SecurityMonitor.log(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.CRITICAL,
        'Failed to initialize secure session',
        { error: String(error) },
      );
      throw error;
    }
  }

  /**
   * Fetch questions securely
   */
  static async fetchQuestions(): Promise<any> {
    if (!this.encryptionKey) {
      await this.initializeSession();
    }

    const identifier = this.getRequestIdentifier();
    if (!RateLimiter.isAllowed(identifier)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      SecurityMonitor.log(SecurityEventType.API_REQUEST, SecurityLevel.INFO, 'Fetching questions', {
        sessionId: this.sessionId,
      });

      const response = await fetch('/api/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Encrypt questions locally for additional security
      const encrypted = await E2EEncryption.encrypt(data, this.encryptionKey!);
      const hash = await E2EEncryption.generateHash(data);

      SecurityMonitor.log(
        SecurityEventType.DATA_ENCRYPTED,
        SecurityLevel.INFO,
        'Questions encrypted',
        {
          sessionId: this.sessionId,
          questionCount: data.questions?.length,
          dataHash: hash.substring(0, 16) + '...',
        },
      );

      // Store encrypted data and hash
      sessionStorage.setItem('quiz_data_encrypted', encrypted);
      sessionStorage.setItem('quiz_data_hash', hash);

      return data;
    } catch (error) {
      SecurityMonitor.log(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.CRITICAL,
        'Failed to fetch questions',
        { error: String(error), sessionId: this.sessionId },
      );
      throw error;
    }
  }

  /**
   * Submit answers securely
   */
  static async submitAnswers(
    selections: Record<number, number | null>,
    antiCheatReport?: unknown,
  ): Promise<any> {
    if (!this.encryptionKey) {
      await this.initializeSession();
    }

    const identifier = this.getRequestIdentifier();
    if (!RateLimiter.isAllowed(identifier)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      // Encrypt selections
      const encryptedSelections = await E2EEncryption.encrypt(selections, this.encryptionKey!);
      const selectionsHash = await E2EEncryption.generateHash(selections);

      SecurityMonitor.log(
        SecurityEventType.DATA_ENCRYPTED,
        SecurityLevel.INFO,
        'Selections encrypted before submission',
        {
          sessionId: this.sessionId,
          selectionCount: Object.keys(selections).length,
          dataHash: selectionsHash.substring(0, 16) + '...',
          antiCheatIncluded: !!antiCheatReport,
        },
      );

      SecurityMonitor.log(
        SecurityEventType.QUIZ_SUBMITTED,
        SecurityLevel.INFO,
        'Submitting quiz answers',
        { sessionId: this.sessionId },
      );

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
          'X-Data-Hash': selectionsHash,
        },
        body: JSON.stringify({
          encryptedData: encryptedSelections,
          selections, // Send both for compatibility
          antiCheatReport, // Include anti-cheat data
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Encrypt result locally
      const encryptedResult = await E2EEncryption.encrypt(result, this.encryptionKey!);
      sessionStorage.setItem('quiz_result_encrypted', encryptedResult);

      SecurityMonitor.log(
        SecurityEventType.DATA_ENCRYPTED,
        SecurityLevel.INFO,
        'Result encrypted and stored',
        {
          sessionId: this.sessionId,
          score: result.score,
        },
      );

      return result;
    } catch (error) {
      SecurityMonitor.log(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.CRITICAL,
        'Failed to submit answers',
        { error: String(error), sessionId: this.sessionId },
      );
      throw error;
    }
  }

  /**
   * Retrieve encrypted data from session
   */
  static async getEncryptedQuestions(): Promise<any | null> {
    const encrypted = sessionStorage.getItem('quiz_data_encrypted');
    const hash = sessionStorage.getItem('quiz_data_hash');

    if (!encrypted || !hash || !this.encryptionKey) {
      return null;
    }

    try {
      const decrypted = await E2EEncryption.decrypt(encrypted, this.encryptionKey);

      // Verify integrity
      const isValid = await E2EEncryption.verifyHash(decrypted, hash);
      if (!isValid) {
        SecurityMonitor.log(
          SecurityEventType.VALIDATION_FAILED,
          SecurityLevel.CRITICAL,
          'Data integrity check failed',
          { sessionId: this.sessionId },
        );
        return null;
      }

      SecurityMonitor.log(
        SecurityEventType.DATA_DECRYPTED,
        SecurityLevel.INFO,
        'Questions decrypted successfully',
        { sessionId: this.sessionId },
      );

      return decrypted;
    } catch (error) {
      SecurityMonitor.log(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.CRITICAL,
        'Failed to decrypt questions',
        { error: String(error), sessionId: this.sessionId },
      );
      return null;
    }
  }

  /**
   * Clear secure session
   */
  static clearSession(): void {
    sessionStorage.removeItem('quiz_encryption_key');
    sessionStorage.removeItem('quiz_data_encrypted');
    sessionStorage.removeItem('quiz_data_hash');
    sessionStorage.removeItem('quiz_result_encrypted');
    this.encryptionKey = null;
    this.sessionId = '';

    SecurityMonitor.log(
      SecurityEventType.QUIZ_STARTED,
      SecurityLevel.INFO,
      'Secure session cleared',
    );
  }

  /**
   * Get security summary
   */
  static getSecuritySummary(): {
    sessionId: string;
    hasEncryptionKey: boolean;
    hasEncryptedData: boolean;
    securityEvents: {
      totalEvents: number;
      criticalCount: number;
      warningCount: number;
      infoCount: number;
      recentCritical: SecurityEvent[];
    };
  } {
    return {
      sessionId: this.sessionId,
      hasEncryptionKey: !!this.encryptionKey,
      hasEncryptedData: !!sessionStorage.getItem('quiz_data_encrypted'),
      securityEvents: SecurityMonitor.getSummary(),
    };
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get request identifier for rate limiting
   */
  private static getRequestIdentifier(): string {
    return this.sessionId || 'anonymous';
  }
}
