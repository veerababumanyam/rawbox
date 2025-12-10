import { User, UserRole, AuthSession, LoginCredentials, AuthError, AuthErrorCode } from '../types';

// Session storage key
const SESSION_STORAGE_KEY = 'RawBox_auth_session';

// Session expiration time (24 hours)
const SESSION_EXPIRATION_HOURS = 24;

// Default users configuration
interface DefaultUser extends Omit<User, 'id' | 'createdAt'> {
    password: string;
}

const DEFAULT_USERS: DefaultUser[] = [
    {
        username: 'superadmin',
        password: 'SuperAdmin@123',
        role: 'SuperAdmin',
        email: 'superadmin@RawBox.local',
        displayName: 'Super Administrator'
    },
    {
        username: 'admin',
        password: 'Admin@123',
        role: 'Admin',
        email: 'admin@RawBox.local',
        displayName: 'Administrator'
    },
    {
        username: 'prouser',
        password: 'ProUser@123',
        role: 'ProUser',
        email: 'prouser@RawBox.local',
        displayName: 'Pro User'
    },
    {
        username: 'poweruser',
        password: 'PowerUser@123',
        role: 'PowerUser',
        email: 'poweruser@RawBox.local',
        displayName: 'Power User'
    },
    {
        username: 'user',
        password: 'User@123',
        role: 'User',
        email: 'user@RawBox.local',
        displayName: 'Regular User'
    }
];

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
    'SuperAdmin': 5,
    'Admin': 4,
    'ProUser': 3,
    'PowerUser': 2,
    'User': 1
};

/**
 * Simple hash function for password hashing
 * Note: This is a basic implementation for MVP. In production, use bcrypt or similar.
 */
export function hashPassword(password: string): string {
    // Simple hash using btoa (base64 encoding) with a salt
    // In production, replace with bcrypt or argon2
    const salt = 'RawBox_salt_2024';
    const combined = salt + password + salt;
    return btoa(combined);
}

/**
 * Compare a plaintext password with a hashed password
 */
export function comparePassword(input: string, hash: string): boolean {
    const inputHash = hashPassword(input);
    return inputHash === hash;
}

/**
 * Generate a secure random session token
 */
function generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate session expiration time
 */
function getSessionExpiration(): string {
    const now = new Date();
    now.setHours(now.getHours() + SESSION_EXPIRATION_HOURS);
    return now.toISOString();
}

/**
 * Authenticate user with credentials
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by username
    const defaultUser = DEFAULT_USERS.find(u => u.username === credentials.username);

    if (!defaultUser) {
        throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid username or password');
    }

    // Compare password
    const passwordHash = hashPassword(defaultUser.password);
    const inputHash = hashPassword(credentials.password);

    if (inputHash !== passwordHash) {
        throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid username or password');
    }

    // Create user object
    const user: User = {
        id: `user-${Date.now()}`,
        username: defaultUser.username,
        role: defaultUser.role,
        email: defaultUser.email,
        displayName: defaultUser.displayName,
        createdAt: new Date().toISOString()
    };

    // Create session
    const session: AuthSession = {
        user,
        token: generateSessionToken(),
        expiresAt: getSessionExpiration()
    };

    // Save session to localStorage
    saveSession(session);

    return session;
}

/**
 * Save session to localStorage
 */
export function saveSession(session: AuthSession): void {
    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
        console.error('Failed to save session:', error);
    }
}

/**
 * Retrieve session from localStorage
 */
export function getStoredSession(): AuthSession | null {
    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) return null;

        const session: AuthSession = JSON.parse(stored);
        return session;
    } catch (error) {
        console.error('Failed to retrieve session:', error);
        return null;
    }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
}

/**
 * Validate if a session is still valid
 */
export function validateSession(session: AuthSession | null): boolean {
    if (!session) return false;

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now >= expiresAt) {
        return false;
    }

    return true;
}

/**
 * Get current valid session or null
 */
export function getCurrentSession(): AuthSession | null {
    const session = getStoredSession();

    if (!validateSession(session)) {
        clearSession();
        return null;
    }

    return session;
}

/**
 * Logout user and clear session
 */
export function logout(): void {
    clearSession();
}

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return userRole === requiredRole;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
}

/**
 * Check if a user has permission based on role hierarchy
 * Higher roles have all permissions of lower roles
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    return userLevel >= requiredLevel;
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role];
}
