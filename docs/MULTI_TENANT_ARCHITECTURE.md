# Multi-Tenant SaaS Architecture

## Overview

RawBox is designed as a **multi-tenant SaaS application** where multiple photography companies (tenants) share the same application infrastructure while maintaining complete data isolation.

## Architecture Principles

### 1. Data Isolation

Each tenant's data is completely segregated:

```
Company A (User ID: 19)
├── Albums (user_id = 19)
├── Photos (via albums)
├── Clients
├── Cloud Storage
└── Audit Logs

Company B (User ID: 20)
├── Albums (user_id = 20)
├── Photos (via albums)
├── Clients
├── Cloud Storage
└── Audit Logs

Company C (User ID: 21)
├── Albums (user_id = 21)
├── Photos (via albums)
├── Clients
├── Cloud Storage
└── Audit Logs
```

### 2. Database Design

**Row-Level Isolation:**
```sql
-- All queries must filter by user_id
SELECT * FROM albums WHERE user_id = :current_user_id;

-- Foreign keys ensure data integrity
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  album_id INTEGER REFERENCES albums(id),
  -- Photos are isolated via album ownership
);
```

**Cascading Deletes:**
```sql
-- Deleting a user removes all their data
DELETE FROM users WHERE id = 19;
-- Automatically deletes:
-- - albums
-- - photos
-- - storage_connections
-- - share_links
-- - audit_logs
```

### 3. Subscription Tiers

| Tier | Albums | Storage | Support | Branding | API | Price |
|------|--------|---------|---------|----------|-----|-------|
| **User** | 10 | 25GB | Email | Standard | ❌ | $29/mo |
| **ProUser** | 50 | 100GB | Priority | Custom | Limited | $99/mo |
| **PowerUser** | Unlimited | 500GB | 24/7 | White-label | Full | $299/mo |

## Implementation

### Authentication & Authorization

```typescript
// 1. User logs in
const session = await login(email, password);

// 2. Session stores user_id
localStorage.setItem('user_id', session.user.id);

// 3. All API requests include user_id
const albums = await fetch('/api/albums', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-User-ID': session.user.id
  }
});

// 4. Backend filters by user_id
app.get('/api/albums', authenticate, async (req, res) => {
  const albums = await db.query(
    'SELECT * FROM albums WHERE user_id = $1',
    [req.user.id]
  );
  res.json(albums);
});
```

### Data Access Patterns

**✅ CORRECT - Always filter by user_id:**
```typescript
// Get user's albums
const albums = await db.query(
  'SELECT * FROM albums WHERE user_id = $1',
  [currentUserId]
);

// Get user's photos
const photos = await db.query(
  'SELECT p.* FROM photos p 
   JOIN albums a ON p.album_id = a.id 
   WHERE a.user_id = $1',
  [currentUserId]
);

// Verify ownership before access
const album = await db.query(
  'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
  [albumId, currentUserId]
);
if (!album) throw new Error('Access denied');
```

**❌ WRONG - No user filter:**
```typescript
// NEVER do this - exposes all data
const albums = await db.query('SELECT * FROM albums');
```

### Cloud Storage Isolation

Each tenant has separate cloud storage:

```typescript
// Root folders are user-specific
CREATE TABLE root_folders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  provider VARCHAR(50),
  provider_folder_id VARCHAR(255),
  UNIQUE(user_id, provider)
);

// Folder mappings link albums to cloud folders
CREATE TABLE folder_mappings (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER REFERENCES albums(id),
  provider VARCHAR(50),
  provider_folder_id VARCHAR(255),
  parent_folder_id VARCHAR(255)
);
```

### Share Links

Share links are tenant-specific:

```typescript
CREATE TABLE share_links (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER REFERENCES albums(id),
  share_token VARCHAR(255) UNIQUE,
  created_by INTEGER REFERENCES users(id),
  expires_at TIMESTAMP
);

// Verify ownership before creating share link
const album = await db.query(
  'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
  [albumId, currentUserId]
);
```

### Audit Logging

Each tenant has separate audit logs:

```typescript
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id INTEGER,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

// Log actions with user context
await logAudit({
  userId: currentUserId,
  action: 'album_created',
  resourceType: 'album',
  resourceId: albumId,
  metadata: { name: album.name }
});
```

## Scaling Considerations

### Database Sharding

For large-scale deployments, consider sharding by user_id:

```
Shard 1: user_id 1-10000
Shard 2: user_id 10001-20000
Shard 3: user_id 20001-30000
```

### Caching Strategy

```typescript
// Cache key includes user_id
const cacheKey = `albums:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) return JSON.parse(cached);

const albums = await db.query(
  'SELECT * FROM albums WHERE user_id = $1',
  [userId]
);

await redis.setex(cacheKey, 3600, JSON.stringify(albums));
```

### Rate Limiting

Apply rate limits per tenant:

```typescript
// Rate limit by user_id, not IP
const rateLimitKey = `ratelimit:${userId}`;
const requests = await redis.incr(rateLimitKey);

if (requests === 1) {
  await redis.expire(rateLimitKey, 60); // 1 minute window
}

if (requests > 100) {
  throw new Error('Rate limit exceeded');
}
```

## Security Best Practices

### 1. Always Validate Ownership

```typescript
async function getAlbum(albumId: number, userId: number) {
  const album = await db.query(
    'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
    [albumId, userId]
  );
  
  if (!album) {
    throw new Error('Album not found or access denied');
  }
  
  return album;
}
```

### 2. Use Row-Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation ON albums
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Set user context
SET app.current_user_id = 19;
```

### 3. Prevent Data Leaks

```typescript
// ❌ WRONG - Exposes other tenants' data
app.get('/api/albums/:id', async (req, res) => {
  const album = await db.query(
    'SELECT * FROM albums WHERE id = $1',
    [req.params.id]
  );
  res.json(album);
});

// ✅ CORRECT - Validates ownership
app.get('/api/albums/:id', authenticate, async (req, res) => {
  const album = await db.query(
    'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  
  if (!album) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json(album);
});
```

### 4. Audit All Access

```typescript
// Log all data access
app.use(async (req, res, next) => {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: `${req.method} ${req.path}`,
      metadata: { 
        params: req.params,
        query: req.query 
      },
      ipAddress: req.ip
    });
  }
  next();
});
```

## Testing Multi-Tenancy

### Test Data Isolation

```typescript
describe('Multi-Tenant Data Isolation', () => {
  it('should not allow access to other tenant data', async () => {
    // Login as Company A
    const sessionA = await login('user@luxestudios.com', 'User@123');
    
    // Get Company A's albums
    const albumsA = await getAlbums(sessionA.user.id);
    expect(albumsA).toHaveLength(4);
    
    // Login as Company B
    const sessionB = await login('pro@creativelens.com', 'ProUser@123');
    
    // Get Company B's albums
    const albumsB = await getAlbums(sessionB.user.id);
    expect(albumsB).toHaveLength(4);
    
    // Verify no overlap
    const albumIdsA = albumsA.map(a => a.id);
    const albumIdsB = albumsB.map(a => a.id);
    expect(albumIdsA).not.toEqual(albumIdsB);
  });
  
  it('should deny access to other tenant resources', async () => {
    const sessionA = await login('user@luxestudios.com', 'User@123');
    const sessionB = await login('pro@creativelens.com', 'ProUser@123');
    
    // Get Company B's album ID
    const albumsB = await getAlbums(sessionB.user.id);
    const albumIdB = albumsB[0].id;
    
    // Try to access Company B's album as Company A
    await expect(
      getAlbum(albumIdB, sessionA.user.id)
    ).rejects.toThrow('Album not found or access denied');
  });
});
```

## Monitoring & Observability

### Key Metrics

- **Tenant Count:** Total active tenants
- **Data Per Tenant:** Albums, photos, storage used
- **API Usage Per Tenant:** Request rate, bandwidth
- **Error Rate Per Tenant:** Failed requests, exceptions
- **Performance Per Tenant:** Response times, query duration

### Alerting

```typescript
// Alert on cross-tenant access attempts
if (album.user_id !== currentUserId) {
  await alert({
    severity: 'critical',
    message: 'Cross-tenant access attempt detected',
    userId: currentUserId,
    attemptedAccess: album.id,
    ownerId: album.user_id
  });
  throw new Error('Access denied');
}
```

## Related Documentation

- [SEED_DATA.md](SEED_DATA.md) - Test data and accounts
- [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md) - Data protection
- [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) - Security best practices

---

**Last Updated:** December 10, 2024
**Version:** 2.1.0
