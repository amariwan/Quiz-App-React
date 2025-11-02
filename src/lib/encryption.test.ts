/**
 * Tests for E2E Encryption Library
 */

import { E2EEncryption } from './encryption';

// Mock Web Crypto API for Node.js environment
const crypto = require('crypto').webcrypto;
global.crypto = crypto;

describe('E2EEncryption', () => {
  describe('Key Generation', () => {
    it('should generate a valid encryption key', async () => {
      const key = await E2EEncryption.generateKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should export and import key successfully', async () => {
      const key = await E2EEncryption.generateKey();
      const exported = await E2EEncryption.exportKey(key);
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);

      const imported = await E2EEncryption.importKey(exported);
      expect(imported).toBeDefined();
      expect(imported.type).toBe('secret');
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt simple data', async () => {
      const key = await E2EEncryption.generateKey();
      const data = { message: 'Hello, World!' };

      const encrypted = await E2EEncryption.encrypt(data, key);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(JSON.stringify(data));

      const decrypted = await E2EEncryption.decrypt(encrypted, key);
      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt complex data', async () => {
      const key = await E2EEncryption.generateKey();
      const data = {
        questions: [
          { id: 1, text: 'Question 1', answers: ['A', 'B', 'C'] },
          { id: 2, text: 'Question 2', answers: ['X', 'Y', 'Z'] },
        ],
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
        },
      };

      const encrypted = await E2EEncryption.encrypt(data, key);
      const decrypted = await E2EEncryption.decrypt(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = await E2EEncryption.generateKey();
      const key2 = await E2EEncryption.generateKey();
      const data = { secret: 'test' };

      const encrypted = await E2EEncryption.encrypt(data, key1);

      await expect(E2EEncryption.decrypt(encrypted, key2)).rejects.toThrow();
    });

    it('should produce different ciphertext for same data', async () => {
      const key = await E2EEncryption.generateKey();
      const data = { message: 'Same data' };

      const encrypted1 = await E2EEncryption.encrypt(data, key);
      const encrypted2 = await E2EEncryption.encrypt(data, key);

      // Different IV should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same data
      const decrypted1 = await E2EEncryption.decrypt(encrypted1, key);
      const decrypted2 = await E2EEncryption.decrypt(encrypted2, key);
      expect(decrypted1).toEqual(data);
      expect(decrypted2).toEqual(data);
    });
  });

  describe('Hash Generation and Verification', () => {
    it('should generate hash for data', async () => {
      const data = { test: 'data' };
      const hash = await E2EEncryption.generateHash(data);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct hash', async () => {
      const data = { test: 'data' };
      const hash = await E2EEncryption.generateHash(data);
      const isValid = await E2EEncryption.verifyHash(data, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect hash', async () => {
      const data = { test: 'data' };
      const wrongData = { test: 'wrong' };
      const hash = await E2EEncryption.generateHash(data);
      const isValid = await E2EEncryption.verifyHash(wrongData, hash);

      expect(isValid).toBe(false);
    });

    it('should generate same hash for same data', async () => {
      const data = { test: 'consistent' };
      const hash1 = await E2EEncryption.generateHash(data);
      const hash2 = await E2EEncryption.generateHash(data);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Base64 Encoding', () => {
    it('should handle special characters', async () => {
      const key = await E2EEncryption.generateKey();
      const data = {
        special: 'Test with äöü 中文 🔒',
        unicode: '💻🔐🛡️',
      };

      const encrypted = await E2EEncryption.encrypt(data, key);
      const decrypted = await E2EEncryption.decrypt(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should handle large data', async () => {
      const key = await E2EEncryption.generateKey();
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          text: `Item ${i}`.repeat(10),
        })),
      };

      const encrypted = await E2EEncryption.encrypt(largeData, key);
      const decrypted = await E2EEncryption.decrypt(encrypted, key);

      expect(decrypted).toEqual(largeData);
    });
  });

  describe('Error Handling', () => {
    it('should throw error on invalid encrypted data', async () => {
      const key = await E2EEncryption.generateKey();
      const invalidData = 'not-valid-base64!@#$%';

      await expect(E2EEncryption.decrypt(invalidData, key)).rejects.toThrow();
    });

    it('should throw error on corrupted encrypted data', async () => {
      const key = await E2EEncryption.generateKey();
      const data = { test: 'data' };
      const encrypted = await E2EEncryption.encrypt(data, key);

      // Corrupt the data
      const corrupted = encrypted.substring(0, encrypted.length - 10) + 'CORRUPTED';

      await expect(E2EEncryption.decrypt(corrupted, key)).rejects.toThrow();
    });
  });
});
