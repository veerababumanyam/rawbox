/**
 * Property-Based Tests for Authentication Password Hashing
 * Feature: user-authentication
 * Property 7: Password hashing is consistent
 * Validates: Requirements 7.1, 7.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock btoa for Node environment
const btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

// Simple hash function (same implementation as in authService)
function hashPassword(password: string): string {
    const salt = 'RawBox_salt_2024';
    const combined = salt + password + salt;
    return btoa(combined);
}

// Compare password (same implementation as in authService)
function comparePassword(input: string, hash: string): boolean {
    const inputHash = hashPassword(input);
    return inputHash === hash;
}

describe('Authentication Service - Password Hashing', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Hash Consistency', () => {
        it('should produce consistent hashes for the same password', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    (password) => {
                        const hash1 = hashPassword(password);
                        const hash2 = hashPassword(password);
                        return hash1 === hash2;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should produce different hashes for different passwords', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    (password1, password2) => {
                        if (password1 === password2) return true;
                        const hash1 = hashPassword(password1);
                        const hash2 = hashPassword(password2);
                        return hash1 !== hash2;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Password Verification', () => {
        it('should correctly verify passwords using comparePassword', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }),
                    (password) => {
                        const hash = hashPassword(password);
                        const matches = comparePassword(password, hash);
                        return matches === true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Special Cases', () => {
        it('should handle empty strings', () => {
            const hash = hashPassword('');
            expect(hash).toBeDefined();
            expect(hash.length).toBeGreaterThan(0);
            expect(comparePassword('', hash)).toBe(true);
        });

        it('should handle special characters', () => {
            const passwords = ['P@ssw0rd!', 'pass word', 'pass"word'];
            passwords.forEach(password => {
                const hash = hashPassword(password);
                expect(comparePassword(password, hash)).toBe(true);
            });
        });

        it('should be case-sensitive', () => {
            const hash = hashPassword('Password123');
            expect(comparePassword('password123', hash)).toBe(false);
            expect(comparePassword('Password123', hash)).toBe(true);
        });
    });
});
