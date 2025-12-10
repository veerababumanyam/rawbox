/**
 * Property-Based Tests for Authentication Service
 * Feature: user-authentication
 *
 * Properties tested:
 * - Property 1: Valid credentials authenticate successfully (Requirements 3.2)
 * - Property 2: Invalid credentials are rejected (Requirements 3.3)
 * - Property 3: Session persistence across page refresh (Requirements 4.3)
 * - Property 4: Expired sessions require re-authentication (Requirements 4.4)
 * - Property 5: Logout clears all session data (Requirements 5.2, 5.3)
 * - Property 6: Role hierarchy is enforced (Requirements 1.4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
    login,
    logout,
    getCurrentSession,
    validateSession,
    saveSession,
    getStoredSession,
    clearSession,
    hasPermission,
    hasRole,
    hasAnyRole,
    getRoleLevel,
    hashPassword,
    comparePassword
} from '../services/authService';
import { UserRole, AuthSession } from '../types';

// Default users for testing
const DEFAULT_CREDENTIALS = [
    { username: 'superadmin', password: 'SuperAdmin@123', role: 'SuperAdmin' as UserRole },
    { username: 'admin', password: 'Admin@123', role: 'Admin' as UserRole },
    { username: 'prouser', password: 'ProUser@123', role: 'ProUser' as UserRole },
    { username: 'poweruser', password: 'PowerUser@123', role: 'PowerUser' as UserRole },
    { username: 'user', password: 'User@123', role: 'User' as UserRole }
];

describe('Authentication Service - Property-Based Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    /**
     * Property 1: Valid credentials authenticate successfully
     * Validates: Requirements 3.2
     *
     * For any valid username/password combination from the default users,
     * the login function should return a valid session with correct user data
     */
    describe('Property 1: Valid credentials authenticate successfully', () => {
        it('should authenticate all valid default users successfully', async () => {
            for (const cred of DEFAULT_CREDENTIALS) {
                const session = await login({
                    username: cred.username,
                    password: cred.password
                });

                // Verify session structure
                expect(session).toBeDefined();
                expect(session.user).toBeDefined();
                expect(session.token).toBeDefined();
                expect(session.expiresAt).toBeDefined();

                // Verify user data
                expect(session.user.username).toBe(cred.username);
                expect(session.user.role).toBe(cred.role);
                expect(session.user.id).toBeDefined();
                expect(session.user.email).toBeDefined();
                expect(session.user.displayName).toBeDefined();

                // Verify token is a valid hex string
                expect(session.token).toMatch(/^[0-9a-f]{64}$/);

                // Verify expiration is in the future
                const expiresAt = new Date(session.expiresAt);
                const now = new Date();
                expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

                // Cleanup
                localStorage.clear();
            }
        });

        it('should save session to localStorage on successful login', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(...DEFAULT_CREDENTIALS),
                    async (cred) => {
                        localStorage.clear();

                        const session = await login({
                            username: cred.username,
                            password: cred.password
                        });

                        const stored = getStoredSession();

                        return stored !== null &&
                               stored.user.username === session.user.username &&
                               stored.token === session.token;
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    /**
     * Property 2: Invalid credentials are rejected
     * Validates: Requirements 3.3
     *
     * For any invalid username or password combination,
     * the login function should throw an AuthError
     */
    describe('Property 2: Invalid credentials are rejected', () => {
        it('should reject login with invalid username', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }).filter(
                        username => !DEFAULT_CREDENTIALS.some(c => c.username === username)
                    ),
                    fc.string({ minLength: 1, maxLength: 50 }),
                    async (username, password) => {
                        try {
                            await login({ username, password });
                            return false; // Should not reach here
                        } catch (error: any) {
                            return error.code === 'INVALID_CREDENTIALS';
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should reject login with valid username but wrong password', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(...DEFAULT_CREDENTIALS),
                    fc.string({ minLength: 1, maxLength: 50 }).filter(
                        pwd => !DEFAULT_CREDENTIALS.some(c => c.password === pwd)
                    ),
                    async (cred, wrongPassword) => {
                        try {
                            await login({
                                username: cred.username,
                                password: wrongPassword
                            });
                            return false; // Should not reach here
                        } catch (error: any) {
                            return error.code === 'INVALID_CREDENTIALS';
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should not save session on failed login', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.string({ minLength: 1, maxLength: 50 }),
                    async (username, password) => {
                        localStorage.clear();

                        try {
                            await login({ username, password });
                        } catch {
                            // Expected to fail
                        }

                        const stored = getStoredSession();
                        return stored === null;
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 3: Session persistence across page refresh
     * Validates: Requirements 4.3
     *
     * Any valid session saved to localStorage should be retrievable
     * and should maintain all its properties
     */
    describe('Property 3: Session persistence across page refresh', () => {
        it('should persist and restore valid sessions', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...DEFAULT_CREDENTIALS),
                    fc.integer({ min: 1, max: 48 }), // hours until expiration
                    (cred, hoursUntilExpiry) => {
                        localStorage.clear();

                        // Create a mock session
                        const expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() + hoursUntilExpiry);

                        const mockSession: AuthSession = {
                            user: {
                                id: `user-${Date.now()}`,
                                username: cred.username,
                                role: cred.role,
                                email: `${cred.username}@RawBox.local`,
                                displayName: cred.username,
                                createdAt: new Date().toISOString()
                            },
                            token: 'a'.repeat(64),
                            expiresAt: expiresAt.toISOString()
                        };

                        // Save session
                        saveSession(mockSession);

                        // Retrieve session
                        const retrieved = getStoredSession();

                        return retrieved !== null &&
                               retrieved.user.username === mockSession.user.username &&
                               retrieved.user.role === mockSession.user.role &&
                               retrieved.token === mockSession.token &&
                               retrieved.expiresAt === mockSession.expiresAt;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Property 4: Expired sessions require re-authentication
     * Validates: Requirements 4.4
     *
     * Any session with an expiration time in the past should be
     * considered invalid and should be cleared
     */
    describe('Property 4: Expired sessions require re-authentication', () => {
        it('should invalidate expired sessions', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...DEFAULT_CREDENTIALS),
                    fc.integer({ min: 1, max: 100 }), // hours in the past
                    (cred, hoursAgo) => {
                        localStorage.clear();

                        // Create an expired session
                        const expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() - hoursAgo);

                        const expiredSession: AuthSession = {
                            user: {
                                id: `user-${Date.now()}`,
                                username: cred.username,
                                role: cred.role,
                                email: `${cred.username}@RawBox.local`,
                                displayName: cred.username,
                                createdAt: new Date().toISOString()
                            },
                            token: 'b'.repeat(64),
                            expiresAt: expiresAt.toISOString()
                        };

                        // Save expired session
                        saveSession(expiredSession);

                        // Validate session
                        const isValid = validateSession(expiredSession);

                        // Try to get current session (should clear the expired one)
                        const current = getCurrentSession();

                        return !isValid && current === null;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should keep valid non-expired sessions', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...DEFAULT_CREDENTIALS),
                    fc.integer({ min: 1, max: 48 }), // hours in the future
                    (cred, hoursAhead) => {
                        localStorage.clear();

                        // Create a valid session
                        const expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() + hoursAhead);

                        const validSession: AuthSession = {
                            user: {
                                id: `user-${Date.now()}`,
                                username: cred.username,
                                role: cred.role,
                                email: `${cred.username}@RawBox.local`,
                                displayName: cred.username,
                                createdAt: new Date().toISOString()
                            },
                            token: 'c'.repeat(64),
                            expiresAt: expiresAt.toISOString()
                        };

                        // Save valid session
                        saveSession(validSession);

                        // Validate session
                        const isValid = validateSession(validSession);

                        // Get current session
                        const current = getCurrentSession();

                        return isValid && current !== null;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Property 5: Logout clears all session data
     * Validates: Requirements 5.2, 5.3
     *
     * After logout, no session should exist in localStorage
     * and getCurrentSession should return null
     */
    describe('Property 5: Logout clears all session data', () => {
        it('should completely clear session on logout', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...DEFAULT_CREDENTIALS),
                    (cred) => {
                        localStorage.clear();

                        // Create and save a session
                        const expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() + 24);

                        const session: AuthSession = {
                            user: {
                                id: `user-${Date.now()}`,
                                username: cred.username,
                                role: cred.role,
                                email: `${cred.username}@RawBox.local`,
                                displayName: cred.username,
                                createdAt: new Date().toISOString()
                            },
                            token: 'd'.repeat(64),
                            expiresAt: expiresAt.toISOString()
                        };

                        saveSession(session);

                        // Verify session exists
                        expect(getStoredSession()).not.toBeNull();

                        // Logout
                        logout();

                        // Verify session is cleared
                        const storedSession = getStoredSession();
                        const currentSession = getCurrentSession();

                        return storedSession === null && currentSession === null;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Property 6: Role hierarchy is enforced
     * Validates: Requirements 1.4
     *
     * Higher level roles should have permissions of all lower level roles
     * Role hierarchy: SuperAdmin > Admin > ProUser > PowerUser > User
     */
    describe('Property 6: Role hierarchy is enforced', () => {
        const roles: UserRole[] = ['SuperAdmin', 'Admin', 'ProUser', 'PowerUser', 'User'];
        const roleHierarchy = {
            'SuperAdmin': 5,
            'Admin': 4,
            'ProUser': 3,
            'PowerUser': 2,
            'User': 1
        };

        it('should enforce role hierarchy in hasPermission', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...roles),
                    fc.constantFrom(...roles),
                    (userRole, requiredRole) => {
                        const result = hasPermission(userRole, requiredRole);
                        const expected = roleHierarchy[userRole] >= roleHierarchy[requiredRole];
                        return result === expected;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should correctly identify exact role matches', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...roles),
                    (role) => {
                        return hasRole(role, role) === true;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should correctly check if user has any of specified roles', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...roles),
                    fc.subarray(roles, { minLength: 1 }),
                    (userRole, requiredRoles) => {
                        const result = hasAnyRole(userRole, requiredRoles);
                        const expected = requiredRoles.includes(userRole);
                        return result === expected;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return correct role levels', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...roles),
                    (role) => {
                        const level = getRoleLevel(role);
                        return level === roleHierarchy[role];
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('SuperAdmin should have permission for all roles', () => {
            roles.forEach(role => {
                expect(hasPermission('SuperAdmin', role)).toBe(true);
            });
        });

        it('User should only have permission for User role', () => {
            expect(hasPermission('User', 'User')).toBe(true);
            expect(hasPermission('User', 'PowerUser')).toBe(false);
            expect(hasPermission('User', 'ProUser')).toBe(false);
            expect(hasPermission('User', 'Admin')).toBe(false);
            expect(hasPermission('User', 'SuperAdmin')).toBe(false);
        });
    });
});
