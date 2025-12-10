# Design Document: Password Hashing Upgrade

## Overview

This document outlines the design for upgrading the RawBox authentication system's password hashing mechanism from btoa (base64 encoding) to argon2id, a modern and secure password hashing algorithm. The upgrade will maintain backward compatibility during migration while ensuring all new password operations use the secure argon2 algorithm.

The implementation will use the `argon2` npm package, maintain the existing async/await API, and automatically migrate old btoa hashes to argon2 format upon successful authentication.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Service                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Password Hashing Module                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Hash Format Detection                          │  │  │
│  │  │  - detectHashFormat()                           │  │  │
│  │  │  - isBtoaHash() / isArgon2Hash()               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Argon2 Hashing (New)                          │  │  │
│  │  │  - hashPasswordArgon2()                         │  │  │
│  │  │  - verifyPasswordArgon2()                       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Legacy Btoa Hashing (Deprecated)              │  │  │
│  │  │  - hashPasswordBtoa()                           │  │  │
│  │  │  - verifyPasswordBtoa()                         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Unified Interface                              │  │  │
│  │  │  - hashPassword() -> delegates to argon2       │  │  │
│  │  │  - comparePassword() -> auto-detects format    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Migration Module                             │  │
│  │  - migrateDefaultUsers()                              │  │
│  │  - upgradeHashOnLogin()                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Migration Strategy

```
User Login Flow:
┌─────────────────┐
│ User submits    │
│ credentials     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Detect hash     │
│ format          │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Btoa   │ │Argon2  │
│ verify │ │verify  │
└───┬────┘ └───┬────┘
    │          │
    │ Success  │ Success
    ▼          │
┌────────┐     │
│Upgrade │     │
│to      │     │
│Argon2  │     │
└───┬────┘     │
    │          │
    └────┬─────┘
         ▼
┌─────────────────┐
│ Return session  │
└─────────────────┘
```

## Components and Interfaces

### 1. Argon2 Configuration

```typescript
// Argon2 hashing configuration
interface Argon2Options {
  type: 2; // argon2id
  memoryCost: number; // Memory in KiB (65536 = 64 MiB)
  timeCost: number; // Number of iterations
  parallelism: number; // Number of threads
  hashLength: number; // Output hash length
}

const ARGON2_CONFIG: Argon2Options = {
  type: 2, // argon2id - balanced protection against side-channel and GPU attacks
  memoryCost: 65536, // 64 MiB - OWASP recommended minimum
  timeCost: 3, // 3 iterations - balance between security and performance
  parallelism: 4, // 4 threads - suitable for modern CPUs
  hashLength: 32 // 32 bytes output
};
```

### 2. Hash Format Detection

```typescript
enum HashFormat {
  BTOA = 'btoa',
  ARGON2 = 'argon2',
  UNKNOWN = 'unknown'
}

/**
 * Detect the format of a password hash
 * Argon2 hashes start with $argon2id$, $argon2i$, or $argon2d$
 * Btoa hashes are base64 strings without the argon2 prefix
 */
function detectHashFormat(hash: string): HashFormat {
  if (hash.startsWith('$argon2')) {
    return HashFormat.ARGON2;
  }
  // Btoa hashes are base64 encoded and don't start with $
  if (/^[A-Za-z0-9+/]+=*$/.test(hash)) {
    return HashFormat.BTOA;
  }
  return HashFormat.UNKNOWN;
}
```

### 3. Password Hashing Functions

```typescript
/**
 * Hash a password using Argon2id
 * @param password - Plaintext password
 * @returns Promise resolving to argon2 hash string
 */
async function hashPasswordArgon2(password: string): Promise<string> {
  const argon2 = await import('argon2');
  
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: ARGON2_CONFIG.memoryCost,
    timeCost: ARGON2_CONFIG.timeCost,
    parallelism: ARGON2_CONFIG.parallelism,
    hashLength: ARGON2_CONFIG.hashLength
  });
}

/**
 * Legacy btoa hashing (deprecated, kept for migration)
 */
function hashPasswordBtoa(password: string): string {
  const salt = 'RawBox_salt_2024';
  const combined = salt + password + salt;
  return btoa(combined);
}

/**
 * Main password hashing function - always uses Argon2
 */
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordArgon2(password);
}
```

### 4. Password Verification Functions

```typescript
/**
 * Verify password against Argon2 hash
 */
async function verifyPasswordArgon2(password: string, hash: string): Promise<boolean> {
  const argon2 = await import('argon2');
  
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Argon2 verification error:', error);
    return false;
  }
}

/**
 * Verify password against btoa hash (legacy)
 */
function verifyPasswordBtoa(password: string, hash: string): boolean {
  const inputHash = hashPasswordBtoa(password);
  return inputHash === hash;
}

/**
 * Compare password with hash - auto-detects format
 * Returns { match: boolean, needsUpgrade: boolean }
 */
export async function comparePassword(
  password: string, 
  hash: string
): Promise<{ match: boolean; needsUpgrade: boolean }> {
  const format = detectHashFormat(hash);
  
  switch (format) {
    case HashFormat.ARGON2:
      const match = await verifyPasswordArgon2(password, hash);
      return { match, needsUpgrade: false };
      
    case HashFormat.BTOA:
      const legacyMatch = verifyPasswordBtoa(password, hash);
      return { match: legacyMatch, needsUpgrade: legacyMatch };
      
    default:
      console.error('Unknown hash format');
      return { match: false, needsUpgrade: false };
  }
}
```

### 5. Migration Functions

```typescript
/**
 * Migrate default users from btoa to argon2
 * Called on application startup
 */
export async function migrateDefaultUsers(): Promise<void> {
  console.log('Checking for password hash migration...');
  
  let migrationNeeded = false;
  
  for (const user of DEFAULT_USERS) {
    const format = detectHashFormat(user.password);
    
    if (format === HashFormat.BTOA) {
      migrationNeeded = true;
      break;
    }
  }
  
  if (!migrationNeeded) {
    console.log('All passwords already using Argon2');
    return;
  }
  
  console.log('Migrating default user passwords to Argon2...');
  
  // Store plaintext passwords temporarily for migration
  const plaintextPasswords: Record<string, string> = {
    'superadmin': 'SuperAdmin@123',
    'admin': 'Admin@123',
    'prouser': 'ProUser@123',
    'poweruser': 'PowerUser@123',
    'user': 'User@123'
  };
  
  for (const user of DEFAULT_USERS) {
    const format = detectHashFormat(user.password);
    
    if (format === HashFormat.BTOA) {
      const plaintext = plaintextPasswords[user.username];
      if (plaintext) {
        user.password = await hashPasswordArgon2(plaintext);
        console.log(`Migrated ${user.username} to Argon2`);
      }
    }
  }
  
  console.log('Password migration complete');
}
```

### 6. Updated Login Function

```typescript
/**
 * Authenticate user with credentials
 * Automatically upgrades btoa hashes to argon2 on successful login
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Find user by username
  const defaultUser = DEFAULT_USERS.find(u => u.username === credentials.username);

  if (!defaultUser) {
    throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid username or password');
  }

  // Compare password with auto-detection
  const { match, needsUpgrade } = await comparePassword(
    credentials.password, 
    defaultUser.password
  );

  if (!match) {
    throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid username or password');
  }

  // Upgrade hash if needed
  if (needsUpgrade) {
    console.log(`Upgrading password hash for ${defaultUser.username}`);
    defaultUser.password = await hashPasswordArgon2(credentials.password);
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
```

## Data Models

### Hash Format Examples

```typescript
// Btoa hash (legacy)
const btoaHash = "UmF3Qm94X3NhbHRfMjAyNFN1cGVyQWRtaW5AMTIzUmF3Qm94X3NhbHRfMjAyNA==";

// Argon2id hash (new)
const argon2Hash = "$argon2id$v=19$m=65536,t=3,p=4$somesalt$hashoutput";

// Hash format structure
interface HashInfo {
  format: HashFormat;
  algorithm?: string; // 'argon2id', 'argon2i', 'argon2d'
  version?: number;
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}
```

### Migration State

```typescript
interface MigrationStatus {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  lastMigrationDate?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Argon2 hash generation produces valid hashes

*For any* valid password string, hashing with argon2 should produce a hash string that starts with "$argon2id$" and can be verified against the original password.

**Validates: Requirements 1.1**

### Property 2: Argon2 verification accepts correct passwords

*For any* password and its argon2 hash, verifying the same password against the hash should return true.

**Validates: Requirements 6.2**

### Property 3: Argon2 verification rejects incorrect passwords

*For any* password and its argon2 hash, verifying a different password against the hash should return false.

**Validates: Requirements 6.3**

### Property 4: Hash format detection correctly identifies argon2 hashes

*For any* string starting with "$argon2", the format detection should identify it as HashFormat.ARGON2.

**Validates: Requirements 6.4**

### Property 5: Hash format detection correctly identifies btoa hashes

*For any* base64-encoded string without the "$argon2" prefix, the format detection should identify it as HashFormat.BTOA.

**Validates: Requirements 6.4**

### Property 6: Btoa hashes are upgraded after successful verification

*For any* user with a btoa hash, successfully logging in should result in their password being upgraded to an argon2 hash.

**Validates: Requirements 5.4, 6.5**

### Property 7: Authentication time remains acceptable

*For any* valid login attempt, the authentication process should complete within 2 seconds.

**Validates: Requirements 3.2**

### Property 8: Plaintext passwords are never stored

*For any* password hashing or verification operation, the plaintext password should not be stored in any persistent storage or logged.

**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Argon2 Library Errors

```typescript
class Argon2Error extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'Argon2Error';
  }
}

// Wrap argon2 operations with error handling
async function safeHashPassword(password: string): Promise<string> {
  try {
    return await hashPasswordArgon2(password);
  } catch (error) {
    console.error('Argon2 hashing failed:', error);
    throw new Argon2Error('Failed to hash password', error as Error);
  }
}
```

### Migration Errors

```typescript
// Handle migration failures gracefully
async function safeMigrateDefaultUsers(): Promise<void> {
  try {
    await migrateDefaultUsers();
  } catch (error) {
    console.error('Password migration failed:', error);
    console.warn('System will continue with existing hashes');
    // Don't throw - allow system to continue with mixed hash formats
  }
}
```

### Verification Errors

```typescript
// Handle verification errors without exposing details
async function safeComparePassword(
  password: string, 
  hash: string
): Promise<{ match: boolean; needsUpgrade: boolean }> {
  try {
    return await comparePassword(password, hash);
  } catch (error) {
    console.error('Password comparison error:', error);
    // Return false on error to prevent authentication
    return { match: false, needsUpgrade: false };
  }
}
```

## Testing Strategy

### Unit Tests

1. **Argon2 Hash Generation**
   - Test that hashes start with "$argon2id$"
   - Test that hashes are different for same password (due to random salt)
   - Test that hashing handles empty strings
   - Test that hashing handles special characters

2. **Argon2 Verification**
   - Test correct password verification returns true
   - Test incorrect password verification returns false
   - Test verification with malformed hash returns false
   - Test verification handles errors gracefully

3. **Hash Format Detection**
   - Test detection of argon2 hashes
   - Test detection of btoa hashes
   - Test detection of unknown formats
   - Test detection with empty strings

4. **Legacy Btoa Functions**
   - Test btoa hashing produces expected format
   - Test btoa verification works correctly
   - Test btoa verification rejects incorrect passwords

5. **Migration Logic**
   - Test migration detects btoa hashes
   - Test migration converts to argon2
   - Test migration preserves password functionality
   - Test migration handles errors

### Property-Based Tests

The property-based testing library for TypeScript/JavaScript is **fast-check**.

Configuration: Each property test should run a minimum of 100 iterations.

1. **Property Test: Argon2 Hash Generation** (Property 1)
   - Generate random passwords
   - Hash with argon2
   - Verify hash format is correct
   - Verify hash can be verified
   - **Feature: password-hashing-upgrade, Property 1: Argon2 hash generation produces valid hashes**

2. **Property Test: Argon2 Correct Password Verification** (Property 2)
   - Generate random passwords
   - Hash with argon2
   - Verify same password returns true
   - **Feature: password-hashing-upgrade, Property 2: Argon2 verification accepts correct passwords**

3. **Property Test: Argon2 Incorrect Password Rejection** (Property 3)
   - Generate random password pairs (different passwords)
   - Hash first password
   - Verify second password returns false
   - **Feature: password-hashing-upgrade, Property 3: Argon2 verification rejects incorrect passwords**

4. **Property Test: Argon2 Format Detection** (Property 4)
   - Generate random passwords
   - Hash with argon2
   - Verify format detection returns ARGON2
   - **Feature: password-hashing-upgrade, Property 4: Hash format detection correctly identifies argon2 hashes**

5. **Property Test: Btoa Format Detection** (Property 5)
   - Generate random passwords
   - Hash with btoa
   - Verify format detection returns BTOA
   - **Feature: password-hashing-upgrade, Property 5: Hash format detection correctly identifies btoa hashes**

6. **Property Test: Hash Upgrade on Login** (Property 6)
   - Create user with btoa hash
   - Perform successful login
   - Verify hash is now argon2 format
   - **Feature: password-hashing-upgrade, Property 6: Btoa hashes are upgraded after successful verification**

7. **Property Test: Authentication Performance** (Property 7)
   - Generate random valid credentials
   - Measure login time
   - Verify completion within 2 seconds
   - **Feature: password-hashing-upgrade, Property 7: Authentication time remains acceptable**

### Integration Tests

1. **Full Login Flow with Argon2**
   - Hash password with argon2
   - Store in default users
   - Perform login
   - Verify session created

2. **Migration on Startup**
   - Start with btoa hashes
   - Call migration function
   - Verify all hashes converted to argon2
   - Verify login still works

3. **Automatic Upgrade on Login**
   - Start with btoa hash
   - Perform successful login
   - Verify hash upgraded to argon2
   - Verify subsequent login uses argon2

4. **Mixed Hash Format Handling**
   - Have some users with btoa, some with argon2
   - Verify all users can login
   - Verify btoa users get upgraded
   - Verify argon2 users remain unchanged

### Testing Framework

- **Unit Tests**: Vitest
- **Property-Based Tests**: fast-check
- **Async Testing**: Native async/await with Vitest
- **Mocking**: Vitest mocking for argon2 library in tests

## Security Considerations

### Argon2 Configuration Rationale

- **Type: argon2id** - Provides balanced protection against both side-channel and GPU attacks
- **Memory Cost: 64 MiB** - OWASP recommended minimum, prevents parallel attacks
- **Time Cost: 3 iterations** - Balances security with user experience (< 2 second login)
- **Parallelism: 4 threads** - Suitable for modern multi-core CPUs
- **Hash Length: 32 bytes** - Standard secure output length

### Migration Security

- Plaintext passwords are only held in memory during migration
- Migration happens automatically on first startup
- Old btoa hashes are immediately replaced after successful verification
- No plaintext passwords are ever logged or stored

### Backward Compatibility

- System supports both hash formats during transition
- Automatic upgrade ensures eventual consistency
- No user action required for migration
- Graceful degradation if argon2 library fails

### Performance Impact

- Argon2 is intentionally slower than btoa (security feature)
- Expected login time: 500-1500ms (within 2 second requirement)
- Migration on startup: < 5 seconds for 5 default users
- No impact on session validation or other operations

## Integration with Existing System

### Changes to authService.ts

1. Add argon2 import and configuration
2. Add hash format detection functions
3. Update hashPassword to use argon2 (now async)
4. Update comparePassword to handle both formats (now async)
5. Add migration function
6. Update login function to handle async hashing
7. Keep legacy btoa functions for migration period

### Changes to AuthContext.tsx

- Login function already uses async/await, no changes needed
- Error handling already in place

### Changes to Tests

1. Update all password hashing tests to use async/await
2. Add new property-based tests for argon2
3. Update existing tests to handle async operations
4. Add migration tests
5. Mock argon2 library for faster test execution

### Changes to Package Dependencies

```json
{
  "dependencies": {
    "argon2": "^0.31.2"
  }
}
```

### Application Startup

```typescript
// In App.tsx or index.tsx
import { migrateDefaultUsers } from './services/authService';

// Call migration on app startup
migrateDefaultUsers().catch(error => {
  console.error('Migration failed:', error);
  // App continues with mixed hash formats
});
```

## Documentation Updates

### Code Comments

```typescript
/**
 * Password Hashing Configuration
 * 
 * Uses Argon2id with OWASP recommended parameters:
 * - Memory: 64 MiB (prevents parallel attacks)
 * - Time: 3 iterations (balances security and UX)
 * - Parallelism: 4 threads (modern CPU optimization)
 * 
 * Migration from legacy btoa encoding happens automatically:
 * 1. On app startup, all default users are migrated
 * 2. On login, btoa hashes are upgraded to argon2
 * 
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
```

### README Updates

- Document that passwords now use argon2
- Note that migration happens automatically
- Explain that first login after upgrade may be slightly slower
- Security best practices for production deployment

## Future Enhancements

1. **Configurable Parameters**
   - Allow argon2 parameters to be configured via environment variables
   - Adjust parameters based on server capabilities

2. **Password Strength Requirements**
   - Enforce minimum password length
   - Require complexity (uppercase, lowercase, numbers, symbols)
   - Check against common password lists

3. **Rate Limiting**
   - Limit login attempts to prevent brute force
   - Implement exponential backoff

4. **Pepper**
   - Add server-side secret (pepper) to hashing
   - Store pepper in environment variable, not in code

5. **Hash Upgrade Tracking**
   - Track which users have been upgraded
   - Report migration progress
   - Alert if users haven't logged in to trigger upgrade

6. **Backend Integration**
   - Move password hashing to backend
   - Never send plaintext passwords to frontend
   - Use secure token-based authentication
