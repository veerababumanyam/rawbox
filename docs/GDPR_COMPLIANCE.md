# GDPR Compliance Documentation

## Overview

RawBox is designed to be fully compliant with the General Data Protection Regulation (GDPR) and other data protection laws. This document outlines our compliance measures and implementation details.

## Core GDPR Principles

### 1. Data Minimization

We only collect and store data necessary for the service:

**Collected Data:**
- User account information (email, company name)
- Client contact details (names, emails, phones, addresses)
- Photos and albums (with metadata)
- Usage logs (for security and debugging)

**Not Collected:**
- Unnecessary personal information
- Tracking cookies (without consent)
- Third-party analytics data

### 2. Purpose Limitation

Data is used only for its intended purpose:

```typescript
// ✅ CORRECT - Using data for intended purpose
const client = await getClient(clientId, userId);
await sendGalleryLink(client.email, galleryUrl);

// ❌ WRONG - Using data for unintended purpose
const client = await getClient(clientId, userId);
await sendMarketingEmail(client.email); // Requires separate consent
```

### 3. Storage Limitation

Data is retained only as long as necessary:

```typescript
// Recycle bin retention
const RECYCLE_BIN_RETENTION_DAYS = 30;

// Automatically delete after retention period
await db.query(`
  DELETE FROM photos 
  WHERE status = 'trash' 
  AND deleted_at < NOW() - INTERVAL '${RECYCLE_BIN_RETENTION_DAYS} days'
`);
```

### 4. Data Accuracy

Users can update their data at any time:

```typescript
// Update client information
app.put('/api/clients/:id', authenticate, async (req, res) => {
  // Verify ownership
  const client = await db.query(
    'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  
  if (!client) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Update data
  await db.query(
    'UPDATE clients SET ... WHERE id = $1',
    [req.params.id]
  );
});
```

### 5. Integrity and Confidentiality

Data is protected through:

- **Encryption at rest:** Database encryption
- **Encryption in transit:** HTTPS/TLS
- **Access controls:** Role-based permissions
- **Audit logging:** All access is logged

## GDPR Rights Implementation

### Right to Access (Article 15)

Users can export all their data:

```typescript
app.get('/api/data-export', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  // Collect all user data
  const userData = {
    user: await getUser(userId),
    albums: await getAlbums(userId),
    photos: await getPhotos(userId),
    clients: await getClients(userId),
    settings: await getSettings(userId),
    auditLogs: await getAuditLogs(userId)
  };
  
  // Generate JSON export
  res.json({
    exportDate: new Date().toISOString(),
    data: userData
  });
});
```

**SQL Implementation:**
```sql
-- Export all data for a user
SELECT * FROM users WHERE id = :user_id;
SELECT * FROM albums WHERE user_id = :user_id;
SELECT * FROM photos WHERE album_id IN (
  SELECT id FROM albums WHERE user_id = :user_id
);
SELECT * FROM clients WHERE user_id = :user_id;
SELECT * FROM audit_logs WHERE user_id = :user_id;
```

### Right to Rectification (Article 16)

Users can update their data:

```typescript
app.put('/api/profile', authenticate, async (req, res) => {
  await db.query(
    'UPDATE users SET email = $1, company_name = $2 WHERE id = $3',
    [req.body.email, req.body.companyName, req.user.id]
  );
  
  await logAudit({
    userId: req.user.id,
    action: 'profile_updated',
    metadata: { fields: Object.keys(req.body) }
  });
});
```

### Right to Erasure (Article 17)

Users can delete their account and all data:

```typescript
app.delete('/api/account', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  // Log deletion request
  await logAudit({
    userId,
    action: 'account_deletion_requested',
    metadata: { timestamp: new Date().toISOString() }
  });
  
  // Delete all user data (cascading)
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
  
  // Cascading deletes automatically remove:
  // - albums
  // - photos
  // - clients
  // - storage_connections
  // - share_links
  // - audit_logs
  
  res.json({ message: 'Account deleted successfully' });
});
```

**SQL Implementation:**
```sql
-- Delete user and all related data
DELETE FROM users WHERE id = :user_id;

-- Cascading foreign keys automatically delete:
-- - albums (ON DELETE CASCADE)
-- - photos (via albums)
-- - storage_connections (ON DELETE CASCADE)
-- - root_folders (ON DELETE CASCADE)
-- - share_links (ON DELETE CASCADE)
-- - audit_logs (ON DELETE CASCADE)
-- - sync_state (ON DELETE CASCADE)
```

### Right to Data Portability (Article 20)

Users can export data in a machine-readable format:

```typescript
app.get('/api/data-export/json', authenticate, async (req, res) => {
  const data = await exportUserData(req.user.id);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=data-export.json');
  res.json(data);
});

app.get('/api/data-export/csv', authenticate, async (req, res) => {
  const data = await exportUserData(req.user.id);
  const csv = convertToCSV(data);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=data-export.csv');
  res.send(csv);
});
```

### Right to Restriction (Article 18)

Users can restrict processing of their data:

```typescript
app.post('/api/account/restrict', authenticate, async (req, res) => {
  await db.query(
    'UPDATE users SET processing_restricted = true WHERE id = $1',
    [req.user.id]
  );
  
  await logAudit({
    userId: req.user.id,
    action: 'processing_restricted',
    metadata: { reason: req.body.reason }
  });
});

// Check restriction before processing
async function processUserData(userId: number) {
  const user = await getUser(userId);
  
  if (user.processing_restricted) {
    throw new Error('Data processing is restricted for this user');
  }
  
  // Continue processing...
}
```

### Right to Object (Article 21)

Users can object to data processing:

```typescript
app.post('/api/account/object', authenticate, async (req, res) => {
  await db.query(
    'UPDATE users SET marketing_consent = false WHERE id = $1',
    [req.user.id]
  );
  
  await logAudit({
    userId: req.user.id,
    action: 'marketing_objection',
    metadata: { reason: req.body.reason }
  });
});
```

## Data Protection Measures

### 1. Data Encryption

```typescript
// Encrypt sensitive data before storage
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Store encrypted API keys
await db.query(
  'INSERT INTO storage_connections (user_id, provider, access_token) VALUES ($1, $2, $3)',
  [userId, provider, encrypt(accessToken)]
);
```

### 2. Access Logging

```typescript
// Log all data access
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id INTEGER,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

// Middleware to log all requests
app.use(async (req, res, next) => {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: `${req.method} ${req.path}`,
      metadata: {
        params: req.params,
        query: req.query
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  }
  next();
});
```

### 3. Data Anonymization

```typescript
// Anonymize data for analytics
function anonymizeUser(user: User) {
  return {
    id: hashUserId(user.id), // One-way hash
    tier: user.tier,
    createdAt: user.createdAt,
    // Remove PII
    email: undefined,
    name: undefined,
    address: undefined
  };
}

// Use anonymized data for analytics
const analytics = await db.query(`
  SELECT 
    tier,
    COUNT(*) as user_count,
    AVG(album_count) as avg_albums
  FROM users
  GROUP BY tier
`);
```

### 4. Data Breach Notification

```typescript
// Detect and notify data breaches
async function detectBreach() {
  // Monitor for suspicious activity
  const suspiciousActivity = await db.query(`
    SELECT user_id, COUNT(*) as failed_attempts
    FROM audit_logs
    WHERE action = 'login_failed'
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 10
  `);
  
  if (suspiciousActivity.length > 0) {
    await notifySecurityTeam({
      type: 'potential_breach',
      affectedUsers: suspiciousActivity
    });
  }
}

// Notify users of breach within 72 hours
async function notifyBreach(userId: number) {
  const user = await getUser(userId);
  
  await sendEmail({
    to: user.email,
    subject: 'Security Notification',
    body: `
      We detected unusual activity on your account.
      Please review your account and change your password.
    `
  });
  
  await logAudit({
    userId,
    action: 'breach_notification_sent',
    metadata: { timestamp: new Date().toISOString() }
  });
}
```

## Multi-Tenant Data Isolation

### Complete Segregation

Each tenant's data is completely isolated:

```sql
-- User A cannot access User B's data
SELECT * FROM albums WHERE user_id = 19; -- User A's albums only
SELECT * FROM albums WHERE user_id = 20; -- User B's albums only

-- Photos are isolated via album ownership
SELECT p.* FROM photos p
JOIN albums a ON p.album_id = a.id
WHERE a.user_id = 19; -- User A's photos only
```

### Verification Queries

```sql
-- Verify no data overlap
SELECT 
  a1.user_id as user_a,
  a2.user_id as user_b,
  COUNT(*) as shared_albums
FROM albums a1
JOIN albums a2 ON a1.id = a2.id AND a1.user_id != a2.user_id
GROUP BY a1.user_id, a2.user_id;
-- Should return 0 rows

-- Verify all data has owner
SELECT COUNT(*) FROM albums WHERE user_id IS NULL;
-- Should return 0

SELECT COUNT(*) FROM photos WHERE album_id NOT IN (SELECT id FROM albums);
-- Should return 0
```

## Consent Management

### Cookie Consent

```typescript
// Check consent before setting cookies
function setCookie(name: string, value: string) {
  const hasConsent = localStorage.getItem('cookieConsent') === 'true';
  
  if (!hasConsent) {
    console.warn('Cookie consent not given');
    return;
  }
  
  document.cookie = `${name}=${value}; Secure; SameSite=Strict`;
}

// Request consent
function requestCookieConsent() {
  // Show consent banner
  const consent = confirm('This site uses cookies. Do you accept?');
  localStorage.setItem('cookieConsent', consent.toString());
  return consent;
}
```

### Marketing Consent

```typescript
// Separate consent for marketing
CREATE TABLE user_consents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  consent_type VARCHAR(50), -- 'marketing', 'analytics', 'third_party'
  granted BOOLEAN,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP
);

// Check consent before marketing
async function sendMarketingEmail(userId: number) {
  const consent = await db.query(
    'SELECT * FROM user_consents WHERE user_id = $1 AND consent_type = $2 AND granted = true',
    [userId, 'marketing']
  );
  
  if (!consent) {
    throw new Error('Marketing consent not granted');
  }
  
  // Send email...
}
```

## Compliance Checklist

### Implementation

- [x] Data minimization - only collect necessary data
- [x] Purpose limitation - use data only for intended purpose
- [x] Storage limitation - delete data after retention period
- [x] Data accuracy - allow users to update data
- [x] Integrity and confidentiality - encrypt and protect data
- [x] Right to access - provide data export
- [x] Right to rectification - allow data updates
- [x] Right to erasure - implement account deletion
- [x] Right to data portability - export in machine-readable format
- [x] Right to restriction - allow processing restriction
- [x] Right to object - allow objection to processing
- [x] Data breach notification - detect and notify within 72 hours
- [x] Consent management - track and respect user consent
- [x] Audit logging - log all data access
- [x] Data anonymization - anonymize for analytics
- [x] Multi-tenant isolation - complete data segregation

### Documentation

- [x] Privacy policy
- [x] Terms of service
- [x] Cookie policy
- [x] Data processing agreement
- [x] Data retention policy
- [x] Breach notification procedure

## Related Documentation

- [MULTI_TENANT_ARCHITECTURE.md](MULTI_TENANT_ARCHITECTURE.md) - Data isolation
- [SEED_DATA.md](SEED_DATA.md) - Test data
- [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) - Security measures

---

**Last Updated:** December 10, 2024
**Version:** 2.1.0
**Compliance:** GDPR, CCPA, PIPEDA
