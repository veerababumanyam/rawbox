# Security & Data Protection Guidelines

## Overview

With 20,000+ photographer customers handling sensitive client photos and personal information, security is critical. Follow these guidelines for all features.

## Authentication & Authorization

### Client Access Control

```typescript
// Password-protected galleries
interface GalleryAccess {
  isPasswordProtected: boolean;
  password?: string; // Hashed on backend
  accessCode?: string; // Unique per-photo access codes
  emailRegistration: boolean; // Require email before viewing
}

// Never expose passwords in frontend state
// ❌ Bad
const [gallery, setGallery] = useState<Album>(albumWithPassword);

// ✅ Good
const [gallery, setGallery] = useState<Omit<Album, 'password'>>(album);
```

### Session Management

```typescript
// Store minimal data in localStorage
// ✅ Good: Store only session token
localStorage.setItem('sessionToken', token);

// ❌ Bad: Store sensitive user data
localStorage.setItem('userData', JSON.stringify(user));

// Clear sensitive data on logout
const handleLogout = () => {
  localStorage.removeItem('sessionToken');
  sessionStorage.clear();
  // Redirect to login
};
```

## Data Privacy

### Personal Identifiable Information (PII)

Never log or expose PII in console, errors, or analytics:

```typescript
// ❌ Bad: Logging PII
console.log('User email:', user.email);
console.log('Client data:', client);

// ✅ Good: Log without PII
console.log('User authenticated:', user.id);
console.log('Client loaded:', client.id);

// Sanitize error messages
try {
  await api.updateClient(client);
} catch (error) {
  // ❌ Bad: Error might contain PII
  console.error('Failed to update client:', error);
  
  // ✅ Good: Generic error message
  console.error('Failed to update client:', error.message);
  showToast('Failed to update client information');
}
```

### Client Data Isolation

```typescript
// Ensure photographers can only access their own data
const fetchGalleries = async () => {
  // Backend must filter by authenticated photographer
  const response = await fetch('/api/galleries', {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    }
  });
  return response.json();
};

// Never trust client-side filtering
// ❌ Bad: Filter on frontend
const myGalleries = allGalleries.filter(g => g.photographerId === currentUser.id);

// ✅ Good: Backend filters by authenticated user
const myGalleries = await fetchGalleries(); // Already filtered
```

## Input Validation & Sanitization

### Form Inputs

Always validate and sanitize user inputs:

```typescript
// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize text inputs (prevent XSS)
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 500); // Limit length
};

// Use in components
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!isValidEmail(email)) {
    setError('Invalid email address');
    return;
  }
  
  const sanitizedName = sanitizeInput(name);
  // Proceed with sanitized data
};
```

### File Upload Security

```typescript
// Validate file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 50MB)' };
  }
  
  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const expectedExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/quicktime': ['mov']
  };
  
  const validExtensions = expectedExtensions[file.type as keyof typeof expectedExtensions];
  if (!validExtensions?.includes(extension || '')) {
    return { valid: false, error: 'File extension does not match type' };
  }
  
  return { valid: true };
};

// Use in upload handler
const handleFileUpload = async (files: FileList) => {
  const validFiles: File[] = [];
  
  for (const file of Array.from(files)) {
    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(`${file.name}: ${validation.error}`, 'error');
      continue;
    }
    validFiles.push(file);
  }
  
  if (validFiles.length === 0) return;
  
  // Upload valid files
  await uploadFiles(validFiles);
};
```

## API Security

### Request Headers

```typescript
// Always include authentication
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('sessionToken');
  
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};

// CSRF protection for state-changing requests
const apiPost = async (url: string, data: any) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  return apiRequest(url, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken || ''
    },
    body: JSON.stringify(data)
  });
};
```

### Rate Limiting (Client-Side)

```typescript
// Prevent abuse of API endpoints
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests = 10;
  private windowMs = 60000; // 1 minute
  
  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests outside window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(endpoint, recentRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Use before API calls
const analyzePhoto = async (photoId: string) => {
  if (!rateLimiter.canMakeRequest('/api/analyze')) {
    showToast('Too many requests. Please wait.', 'warning');
    return;
  }
  
  return apiRequest(`/api/photos/${photoId}/analyze`, { method: 'POST' });
};
```

## Secure Data Storage

### LocalStorage Best Practices

```typescript
// Only store non-sensitive data
// ✅ Good: Theme preference, UI state
localStorage.setItem('theme', 'dark');
localStorage.setItem('sidebarCollapsed', 'true');

// ❌ Bad: Sensitive data
localStorage.setItem('apiKey', key); // Never store API keys
localStorage.setItem('password', password); // Never store passwords
localStorage.setItem('clientData', JSON.stringify(clients)); // Too much data

// Encrypt sensitive data if absolutely necessary
const encryptData = (data: string, key: string): string => {
  // Use Web Crypto API for encryption
  // This is a simplified example
  return btoa(data); // Use proper encryption in production
};
```

### Session Storage

```typescript
// Use sessionStorage for temporary data
// Cleared when tab closes
sessionStorage.setItem('uploadProgress', JSON.stringify(progress));
sessionStorage.setItem('tempGalleryId', galleryId);

// Clear on navigation
useEffect(() => {
  return () => {
    sessionStorage.removeItem('uploadProgress');
  };
}, []);
```

## Content Security

### Image URLs

```typescript
// Validate image URLs before rendering
const isValidImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false;
    // Only allow trusted domains
    const trustedDomains = ['picsum.photos', 'images.unsplash.com', 'your-cdn.com'];
    return trustedDomains.some(domain => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Use in components
const SafeImage = ({ src, alt }: { src: string; alt: string }) => {
  if (!isValidImageUrl(src)) {
    return <div className="bg-muted">Invalid image URL</div>;
  }
  
  return <img src={src} alt={alt} />;
};
```

### XSS Prevention

```typescript
// Never use dangerouslySetInnerHTML with user content
// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Good: Use text content
<div>{userInput}</div>

// If HTML is necessary, sanitize first
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

## Error Handling

### Secure Error Messages

```typescript
// Don't expose system details in errors
// ❌ Bad
catch (error) {
  showToast(`Database error: ${error.message}`, 'error');
  console.error('SQL query failed:', error.stack);
}

// ✅ Good
catch (error) {
  showToast('Failed to load data. Please try again.', 'error');
  // Log to monitoring service (not console)
  logError('gallery-load-failed', { galleryId, userId });
}

// Generic error messages for users
const USER_FRIENDLY_ERRORS = {
  'network-error': 'Connection failed. Please check your internet.',
  'auth-error': 'Session expired. Please log in again.',
  'permission-error': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested item was not found.',
  'server-error': 'Something went wrong. Please try again later.'
};
```

## AI Service Security

### API Key Protection

```typescript
// Never expose API keys in frontend code
// ❌ Bad
const GEMINI_API_KEY = 'AIzaSy...'; // Hardcoded key

// ✅ Good: Use environment variables (injected at build time)
const apiKey = process.env.GEMINI_API_KEY;

// Better: Proxy through backend
const analyzePhoto = async (photoUrl: string) => {
  // Backend handles API key
  return fetch('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ photoUrl })
  });
};
```

### Input Validation for AI

```typescript
// Validate inputs before sending to AI
const analyzePhotoSafe = async (photoUrl: string) => {
  // Validate URL
  if (!isValidImageUrl(photoUrl)) {
    throw new Error('Invalid photo URL');
  }
  
  // Check file size (don't send huge files)
  const response = await fetch(photoUrl, { method: 'HEAD' });
  const size = parseInt(response.headers.get('content-length') || '0');
  if (size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Image too large for analysis');
  }
  
  return geminiService.analyzePhoto(photoUrl);
};
```

## Compliance & Privacy

### GDPR Considerations

```typescript
// Data deletion
const deleteUserData = async (userId: string) => {
  // Delete all user data
  await api.delete(`/api/users/${userId}`);
  
  // Clear local storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any cached data
  cache.clear();
};

// Data export
const exportUserData = async (userId: string) => {
  const data = await api.get(`/api/users/${userId}/export`);
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-data-${userId}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### Cookie Consent

```typescript
// Check consent before setting cookies
const setCookie = (name: string, value: string) => {
  const hasConsent = localStorage.getItem('cookieConsent') === 'true';
  
  if (!hasConsent) {
    console.warn('Cookie consent not given');
    return;
  }
  
  document.cookie = `${name}=${value}; Secure; SameSite=Strict`;
};
```

## Security Checklist

Before deploying features:

- [ ] All API requests include authentication
- [ ] User inputs are validated and sanitized
- [ ] File uploads are validated (type, size, extension)
- [ ] No PII in console logs or error messages
- [ ] No sensitive data in localStorage
- [ ] Image URLs are validated before rendering
- [ ] Error messages don't expose system details
- [ ] Rate limiting is implemented for expensive operations
- [ ] HTTPS is enforced for all requests
- [ ] CSRF tokens are included in state-changing requests
- [ ] API keys are not exposed in frontend code
- [ ] User sessions expire after inactivity
- [ ] Data deletion and export features work correctly

## Incident Response

If a security issue is discovered:

1. **Assess severity**: Critical, High, Medium, Low
2. **Contain**: Disable affected feature if necessary
3. **Notify**: Alert team and affected users if data breach
4. **Fix**: Implement and test fix
5. **Deploy**: Emergency deployment if critical
6. **Document**: Post-mortem and lessons learned
7. **Monitor**: Watch for similar issues

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [GDPR Compliance](https://gdpr.eu/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
