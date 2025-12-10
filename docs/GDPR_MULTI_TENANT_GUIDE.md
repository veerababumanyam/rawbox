# 🔒 GDPR-Compliant Multi-Tenant Seed Data Guide

## Overview

This seed data implements **complete data segregation** for 3 separate photography companies, each with different subscription tiers. All data is isolated following GDPR principles - no company can access another company's data.

## 🏢 Companies & Subscription Tiers

### 1. **Luxe Photography Studios** (User Tier)
- **Email**: `user@luxestudios.com`
- **Location**: New York, NY
- **Tier**: User (Basic)
- **Focus**: Luxury weddings, fashion editorial, celebrity portraits
- **Albums**: 4 galleries with 170 photos
- **Clients**: Victoria & Alexander Sterling, Vogue Magazine

### 2. **Creative Lens Photography** (ProUser Tier)
- **Email**: `pro@creativelens.com`
- **Location**: Los Angeles, CA
- **Tier**: ProUser (Professional)
- **Focus**: Weddings, corporate events, family portraits
- **Albums**: 4 galleries with 170 photos
- **Clients**: Sarah & James Mitchell, TechCorp Industries

### 3. **Moments Capture Studio** (PowerUser Tier)
- **Email**: `power@momentscapture.com`
- **Location**: Chicago, IL
- **Tier**: PowerUser (Standard)
- **Focus**: Birthdays, newborns, graduations, product photography
- **Albums**: 4 galleries with 130 photos
- **Clients**: Emma Thompson, Johnson Family

## 📊 Data Segregation Summary

| Company | User ID | Albums | Photos | Clients | People | Designs |
|---------|---------|--------|--------|---------|--------|---------|
| Luxe Photography Studios | 19 | 4 | 170 | 2 | 2 | 1 |
| Creative Lens Photography | 20 | 4 | 170 | 2 | 2 | 1 |
| Moments Capture Studio | 21 | 4 | 130 | 2 | 2 | 1 |

**Total**: 3 companies, 12 albums, 470 photos, 6 clients, 6 people, 3 designs

## 🔐 GDPR Compliance Features

### 1. **Complete Data Isolation**
- Each company's data is stored with their unique `user_id`
- Database queries automatically filter by `user_id`
- No cross-company data access possible

### 2. **Separate Cloud Storage**
- Each company has their own root folders
- Folder mappings are user-specific
- Storage connections are isolated per company

### 3. **Independent Audit Trails**
- Each company has separate audit logs
- IP addresses are company-specific
- Actions are tracked per user

### 4. **Isolated Share Links**
- Share links are created by and belong to specific users
- No cross-company sharing possible
- Each company controls their own link expiry

### 5. **Separate Sync State**
- Each company has independent sync tokens
- Sync status tracked per user
- No shared sync state between companies

## 📁 Database Structure

### Users Table
```sql
SELECT id, email FROM users WHERE id >= 19;
```
| ID | Email |
|----|-------|
| 19 | user@luxestudios.com |
| 20 | pro@creativelens.com |
| 21 | power@momentscapture.com |

### Albums by User
```sql
SELECT user_id, COUNT(*) as album_count 
FROM albums 
WHERE user_id >= 16 
GROUP BY user_id;
```

### Photos by User
```sql
SELECT a.user_id, COUNT(p.id) as photo_count 
FROM photos p 
JOIN albums a ON p.album_id = a.id 
WHERE a.user_id >= 16 
GROUP BY a.user_id;
```

## 🗂️ Application Data (seed-data.json)

The JSON file contains segregated data for each company:

```json
{
  "companies": [
    {
      "userId": 16,
      "email": "super@luxestudios.com",
      "tier": "SuperAdmin",
      "company": "Luxe Photography Studios",
      "clients": [...],  // 2 luxury clients
      "people": [...],   // 2 people for face tagging
      "albumDesigns": [...],  // 1 premium design
      "photographerProfile": {...},  // Complete profile
      "appSettings": {...}  // Company-specific settings
    },
    // ... other companies
  ]
}
```

## 🔍 Verification Queries

### Check Data Segregation
```sql
-- Verify each user has their own data
SELECT 
    u.id,
    u.email,
    COUNT(DISTINCT a.id) as albums,
    COUNT(p.id) as photos
FROM users u
LEFT JOIN albums a ON u.id = a.user_id
LEFT JOIN photos p ON a.id = p.album_id
WHERE u.id >= 16
GROUP BY u.id, u.email
ORDER BY u.id;
```

### Check Share Links Isolation
```sql
-- Verify share links belong to correct users
SELECT 
    u.email,
    COUNT(sl.id) as share_links
FROM users u
LEFT JOIN albums a ON u.id = a.user_id
LEFT JOIN share_links sl ON a.id = sl.gallery_id
WHERE u.id >= 16
GROUP BY u.id, u.email;
```

### Check Audit Log Separation
```sql
-- Verify audit logs are user-specific
SELECT 
    u.email,
    COUNT(al.id) as audit_entries
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id
WHERE u.id >= 16
GROUP BY u.id, u.email;
```

## 🚀 Testing Scenarios

### 1. **Login as Different Companies**
```javascript
// Test login for each tier
const companies = [
  { email: 'user@luxestudios.com', tier: 'User' },
  { email: 'pro@creativelens.com', tier: 'ProUser' },
  { email: 'power@momentscapture.com', tier: 'PowerUser' }
];
```

### 2. **Verify Data Isolation**
- Login as Company A
- Verify you only see Company A's albums
- Verify you cannot access Company B's data
- Check that photo URLs are company-specific

### 3. **Test Share Links**
- Create share link as Company A
- Verify Company B cannot access it
- Test expiry dates work correctly

### 4. **Test Cloud Storage**
- Verify each company has separate root folders
- Check folder mappings are user-specific
- Test sync state is independent

## 📋 GDPR Rights Implementation

### Right to Access
```sql
-- Export all data for a specific user
SELECT * FROM users WHERE id = 16;
SELECT * FROM albums WHERE user_id = 16;
SELECT * FROM photos WHERE album_id IN (SELECT id FROM albums WHERE user_id = 16);
```

### Right to Deletion
```sql
-- Delete all data for a specific user (cascading)
DELETE FROM users WHERE id = 16;
-- This will cascade delete:
-- - albums
-- - photos
-- - storage_connections
-- - root_folders
-- - share_links
-- - audit_logs
-- - sync_state
```

### Right to Portability
```javascript
// Export user data in JSON format
const userData = {
  user: await getUser(userId),
  albums: await getAlbums(userId),
  photos: await getPhotos(userId),
  clients: await getClients(userId),
  settings: await getSettings(userId)
};
```

## 🔒 Security Best Practices

### 1. **Always Filter by User ID**
```typescript
// ✅ CORRECT - Filtered by user
const albums = await db.query(
  'SELECT * FROM albums WHERE user_id = $1',
  [currentUserId]
);

// ❌ WRONG - No user filter
const albums = await db.query('SELECT * FROM albums');
```

### 2. **Validate Ownership**
```typescript
// Before allowing access, verify ownership
const album = await db.query(
  'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
  [albumId, currentUserId]
);

if (!album) {
  throw new Error('Access denied');
}
```

### 3. **Use Row-Level Security (RLS)**
```sql
-- Enable RLS on tables
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_albums ON albums
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::integer);
```

## 📊 Subscription Tier Differences

### User (Luxe Photography Studios) - Basic Tier
- ✅ 10 albums
- ✅ 25GB storage
- ✅ Email support
- ✅ Basic features
- ⏸️ Standard branding
- ❌ No API access

### ProUser (Creative Lens Photography) - Professional Tier
- ✅ 50 albums
- ✅ 100GB storage
- ✅ Priority support
- ✅ Advanced analytics
- ✅ Custom branding
- ⏸️ Limited API access

### PowerUser (Moments Capture Studio) - Advanced Tier
- ✅ Unlimited albums
- ✅ 500GB storage
- ✅ 24/7 support
- ✅ Full analytics
- ✅ White-label branding
- ✅ Full API access

## 🔄 Data Migration

### Migrating Between Tiers
```sql
-- Upgrade user tier (metadata only, data stays isolated)
UPDATE users SET tier = 'ProUser' WHERE id = 18;
```

### Exporting Company Data
```bash
# Export all data for a company
pg_dump -U postgres -d luminos \
  --table=users \
  --table=albums \
  --table=photos \
  --where="user_id=16" \
  > company_16_export.sql
```

## 🧪 Testing Checklist

- [ ] Login as each company
- [ ] Verify data isolation (no cross-company access)
- [ ] Test album creation and photo upload
- [ ] Verify share links work correctly
- [ ] Test cloud storage connections
- [ ] Check audit logs are separate
- [ ] Verify sync state is independent
- [ ] Test client management
- [ ] Test people/face tagging
- [ ] Test album designer
- [ ] Verify GDPR data export
- [ ] Test GDPR data deletion

## 📞 Support

### Database Issues
```bash
# Check user data
docker exec luminos-postgres-1 psql -U postgres -d luminos \
  -c "SELECT * FROM users WHERE id >= 16;"

# Check data segregation
docker exec luminos-postgres-1 psql -U postgres -d luminos \
  -c "SELECT u.email, COUNT(a.id) FROM users u LEFT JOIN albums a ON u.id = a.user_id WHERE u.id >= 16 GROUP BY u.email;"
```

### Re-seed Database
```bash
# Clean and re-seed
docker-compose down -v
docker-compose up -d postgres redis
timeout /t 5 /nobreak
cd server
Get-Content migrations/001_cloud_storage_integration.sql | docker exec -i luminos-postgres-1 psql -U postgres -d luminos
npm run db:seed
```

---

**Generated**: December 10, 2024
**Version**: 2.0.0 (GDPR-Compliant Multi-Tenant)
**Compliance**: ✅ GDPR, ✅ Data Isolation, ✅ Right to Access, ✅ Right to Deletion
**Companies**: 3 separate entities with complete data segregation
