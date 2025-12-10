# Design Document

## Overview

This document outlines the design for a role-based authentication system for the RawBox photography platform. The system will provide secure user authentication with five distinct roles (SuperAdmin, Admin, ProUser, PowerUser, User), session management, and seamless integration with the existing React application architecture.

The authentication system will be implemented as a frontend-first solution with local storage for session persistence, designed to be easily upgraded to a backend-integrated solution in the future.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Authentication Context                    │  │
│  │  - Current User State                                  │  │
│  │  - Login/Logout Methods                                │  │
│  │  - Role-based Permission Checks                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────┐    │
│  │                        │                             │    │
│  ▼                        ▼                             ▼    │
│ ┌──────────┐      ┌──────────────┐           ┌──────────┐  │
│ │  Login   │      │  Protected   │           │  Layout  │  │
│ │Component │      │  Components  │           │Component │  │
│ └──────────┘      └──────────────┘           └──────────┘  │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Local Storage  │
                  │  - Session Token│
                  │  - User Role    │
                  └─────────────────┘
```

### Component Hierarchy

```
App.tsx
├── AuthProvider (Context)
│   ├── LoginView (Unauthenticated)
│   └── Layout (Authenticated)
│       ├── Sidebar (with role-based navigation)
│       └── Main Content (protected routes)
```

## Components and Interfaces

### 1. Authentication Types

```typescript
// Add to types.ts

export type UserRole = 'SuperAdmin' | 'Admin' | 'ProUser' | 'PowerUser' | 'User';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
```

### 2. Authentication Service

**File**: `services/authService.ts`

Responsibilities:
- Validate credentials against default users
- Hash and compare passwords
- Generate and validate session tokens
- Manage session storage
- Provide role-based permission checks

```typescript
interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): void;
  getCurrentSession(): AuthSession | null;
  validateSession(): boolean;
  hasPermission(requiredRole: UserRole): boolean;
  hashPassword(password: string): string;
  comparePassword(input: string, hash: string): boolean;
}
```

### 3. Authentication Context

**File**: `contexts/AuthContext.tsx`

Responsibilities:
- Provide authentication state to entire app
- Expose login/logout methods
- Handle session persistence
- Trigger re-renders on auth state changes

```typescript
interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}
```

### 4. Login Component

**File**: `components/LoginView.tsx`

Responsibilities:
- Render login form
- Handle form validation
- Display error messages
- Trigger authentication

UI Elements:
- Username input field
- Password input field (masked)
- Login button
- Error message display
- Branding/logo

### 5. Protected Route Wrapper

**File**: `components/ProtectedRoute.tsx`

Responsibilities:
- Check authentication status
- Redirect to login if unauthenticated
- Optionally check role permissions
- Show loading state during validation

### 6. Role-Based UI Components

Update existing components to show/hide features based on role:
- Layout sidebar navigation
- Admin toolbars
- Action buttons
- Settings panels

## Data Models

### Default Users Configuration

```typescript
// services/authService.ts

const DEFAULT_USERS: Array<Omit<User, 'id' | 'createdAt'> & { password: string }> = [
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
```

### Role Hierarchy and Permissions

```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'SuperAdmin': 5,
  'Admin': 4,
  'ProUser': 3,
  'PowerUser': 2,
  'User': 1
};

// Permission matrix (example)
const PERMISSIONS = {
  'manage_users': ['SuperAdmin'],
  'manage_settings': ['SuperAdmin', 'Admin'],
  'create_albums': ['SuperAdmin', 'Admin', 'ProUser', 'PowerUser'],
  'upload_photos': ['SuperAdmin', 'Admin', 'ProUser', 'PowerUser', 'User'],
  'view_albums': ['SuperAdmin', 'Admin', 'ProUser', 'PowerUser', 'User'],
  'delete_albums': ['SuperAdmin', 'Admin'],
  'manage_clients': ['SuperAdmin', 'Admin', 'ProUser'],
  'design_print_albums': ['SuperAdmin', 'Admin', 'ProUser']
};
```

### Session Storage Schema

```typescript
// Stored in localStorage as JSON

interface StoredSession {
  token: string;
  userId: string;
  username: string;
  role: UserRole;
  expiresAt: string; // ISO date string
}

// Storage key
const SESSION_STORAGE_KEY = 'RawBox_auth_session';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid credentials authenticate successfully

*For any* default user account with correct username and password, the authentication system should successfully create a session and return the user object with the correct role.

**Validates: Requirements 3.2**

### Property 2: Invalid credentials are rejected

*For any* login attempt with incorrect username or password, the authentication system should reject the attempt and not create a session.

**Validates: Requirements 3.3**

### Property 3: Session persistence across page refresh

*For any* valid authenticated session, refreshing the page should restore the session without requiring re-authentication, as long as the session has not expired.

**Validates: Requirements 4.3**

### Property 4: Expired sessions require re-authentication

*For any* session where the expiration time has passed, attempting to restore the session should fail and require the user to log in again.

**Validates: Requirements 4.4**

### Property 5: Logout clears all session data

*For any* authenticated user, logging out should completely remove all session data from storage and set the authentication state to unauthenticated.

**Validates: Requirements 5.2, 5.3**

### Property 6: Role hierarchy is enforced

*For any* permission check, a user with a higher role in the hierarchy should have all permissions of lower roles.

**Validates: Requirements 1.4**

### Property 7: Password hashing is consistent

*For any* password, hashing it multiple times should produce the same hash value, and comparing the original password against the hash should always succeed.

**Validates: Requirements 7.1, 7.2**

### Property 8: Unauthenticated users cannot access protected features

*For any* protected component or route, attempting to access it without a valid session should redirect to the login page.

**Validates: Requirements 3.1**

## Error Handling

### Authentication Errors

```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_SESSION = 'INVALID_SESSION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

### Error Messages

User-facing error messages should be generic to avoid revealing system details:

- Invalid credentials: "Invalid username or password"
- Session expired: "Your session has expired. Please log in again."
- Permission denied: "You don't have permission to perform this action."
- Network error: "Connection failed. Please try again."

### Error Recovery

- **Invalid credentials**: Allow user to retry with clear error message
- **Session expired**: Automatically redirect to login, preserve intended destination
- **Permission denied**: Show appropriate UI message, hide unauthorized features
- **Network errors**: Provide retry mechanism, show offline indicator

## Testing Strategy

### Unit Tests

1. **Authentication Service Tests**
   - Test password hashing produces consistent results
   - Test password comparison with correct/incorrect passwords
   - Test session token generation
   - Test session validation logic
   - Test role hierarchy comparisons

2. **Login Component Tests**
   - Test form validation (empty fields, invalid format)
   - Test error message display
   - Test successful login flow
   - Test loading states

3. **Auth Context Tests**
   - Test context provider initialization
   - Test login method updates state correctly
   - Test logout method clears state
   - Test session restoration on mount

### Property-Based Tests

The property-based testing library for TypeScript/JavaScript is **fast-check**.

Configuration: Each property test should run a minimum of 100 iterations.

1. **Property Test: Valid Credentials Authentication** (Property 1)
   - Generate random valid user credentials from DEFAULT_USERS
   - Verify login succeeds and returns correct user data
   - **Feature: user-authentication, Property 1: Valid credentials authenticate successfully**

2. **Property Test: Invalid Credentials Rejection** (Property 2)
   - Generate random invalid credentials (wrong username or password)
   - Verify login fails with appropriate error
   - **Feature: user-authentication, Property 2: Invalid credentials are rejected**

3. **Property Test: Session Persistence** (Property 3)
   - Create valid session with random user
   - Simulate page refresh (clear memory, restore from storage)
   - Verify session is restored correctly
   - **Feature: user-authentication, Property 3: Session persistence across page refresh**

4. **Property Test: Expired Session Handling** (Property 4)
   - Create session with past expiration time
   - Attempt to validate session
   - Verify session is rejected
   - **Feature: user-authentication, Property 4: Expired sessions require re-authentication**

5. **Property Test: Logout Cleanup** (Property 5)
   - Create authenticated session
   - Perform logout
   - Verify all storage is cleared and state is reset
   - **Feature: user-authentication, Property 5: Logout clears all session data**

6. **Property Test: Role Hierarchy** (Property 6)
   - Generate random role pairs
   - Verify higher roles have permissions of lower roles
   - **Feature: user-authentication, Property 6: Role hierarchy is enforced**

7. **Property Test: Password Hashing Consistency** (Property 7)
   - Generate random passwords
   - Hash multiple times and verify consistency
   - Verify comparison works correctly
   - **Feature: user-authentication, Property 7: Password hashing is consistent**

### Integration Tests

1. **Full Login Flow**
   - Render login component
   - Enter credentials
   - Submit form
   - Verify redirect to main app
   - Verify user data in context

2. **Protected Route Access**
   - Attempt to access protected route without auth
   - Verify redirect to login
   - Login successfully
   - Verify access granted

3. **Session Restoration**
   - Login successfully
   - Simulate page refresh
   - Verify user remains authenticated
   - Verify UI shows authenticated state

4. **Logout Flow**
   - Login successfully
   - Navigate to different views
   - Logout
   - Verify redirect to login
   - Verify cannot access protected routes

### Testing Framework

- **Unit Tests**: Vitest (already configured in project)
- **Property-Based Tests**: fast-check
- **Component Tests**: React Testing Library
- **Integration Tests**: Vitest + React Testing Library

## Security Considerations

### Password Storage

- Passwords are hashed using a secure algorithm (bcrypt or similar)
- Never store plaintext passwords
- Never log passwords
- Never expose passwords in API responses

### Session Management

- Sessions expire after a reasonable time (e.g., 24 hours)
- Session tokens are cryptographically secure random strings
- Sessions are validated on every protected route access
- Logout immediately invalidates session

### Input Validation

- Username: alphanumeric, 3-20 characters
- Password: minimum 8 characters (enforced on change, not login)
- Sanitize all inputs to prevent XSS
- Rate limit login attempts (future enhancement)

### Storage Security

- Use localStorage for session persistence (acceptable for MVP)
- Consider httpOnly cookies for production
- Never store sensitive data beyond session token
- Clear storage completely on logout

## Integration with Existing Application

### Changes to App.tsx

1. Wrap entire app with `AuthProvider`
2. Conditionally render `LoginView` or `Layout` based on auth state
3. Pass `currentUser` to components that need role-based features

```typescript
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (!isAuthenticated) {
    return <LoginView />;
  }
  
  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {/* Existing app content */}
    </Layout>
  );
}
```

### Changes to Layout.tsx

1. Display current user information in sidebar
2. Wire up logout button to auth context
3. Show/hide navigation items based on role

### Changes to Types.ts

1. Add `User`, `UserRole`, `AuthSession`, `LoginCredentials` types
2. Export authentication-related interfaces

### New Files to Create

1. `services/authService.ts` - Core authentication logic
2. `contexts/AuthContext.tsx` - React context for auth state
3. `components/LoginView.tsx` - Login UI component
4. `hooks/useAuth.ts` - Custom hook for accessing auth context
5. `utils/permissions.ts` - Permission checking utilities

## Future Enhancements

1. **Backend Integration**
   - Replace local auth with API calls
   - Implement JWT tokens
   - Add refresh token mechanism

2. **Enhanced Security**
   - Two-factor authentication
   - Password reset flow
   - Account lockout after failed attempts
   - Session timeout warnings

3. **User Management**
   - Create/edit/delete users (SuperAdmin only)
   - Change passwords
   - Assign/modify roles
   - User activity logs

4. **Advanced Permissions**
   - Granular permission system
   - Custom role creation
   - Resource-level permissions (e.g., specific albums)

5. **Audit Trail**
   - Log all authentication events
   - Track user actions
   - Security event monitoring
