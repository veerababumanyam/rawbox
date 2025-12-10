# Seed Data Documentation

## Overview

RawBox includes comprehensive seed data for testing the multi-tenant SaaS architecture. The seed data creates 3 separate photography companies with complete data isolation.

## Test Companies

### 1. Luxe Photography Studios (User Tier)

**Account Details:**
- **Email:** `user@luxestudios.com`
- **Password:** `User@123`
- **Tier:** User (Basic)
- **Location:** New York, NY

**Subscription Features:**
- 10 albums maximum
- 25GB storage
- Email support
- Standard branding
- No API access

**Test Data:**
- 4 albums (170 photos)
- 2 clients: Victoria & Alexander Sterling, Vogue Magazine
- 2 people for face tagging
- 1 album design
- 2 share links
- Cloud storage: Google Drive + Dropbox

---

### 2. Creative Lens Photography (ProUser Tier)

**Account Details:**
- **Email:** `pro@creativelens.com`
- **Password:** `ProUser@123`
- **Tier:** ProUser (Professional)
- **Location:** Los Angeles, CA

**Subscription Features:**
- 50 albums maximum
- 100GB storage
- Priority support
- Custom branding
- Advanced analytics
- Limited API access

**Test Data:**
- 4 albums (170 photos)
- 2 clients: Sarah & James Mitchell, TechCorp Industries
- 2 people for face tagging
- 1 album design
- 2 share links
- Cloud storage: Google Drive + Dropbox

---

### 3. Moments Capture Studio (PowerUser Tier)

**Account Details:**
- **Email:** `power@momentscapture.com`
- **Password:** `PowerUser@123`
- **Tier:** PowerUser (Advanced)
- **Location:** Chicago, IL

**Subscription Features:**
- Unlimited albums
- 500GB storage
- 24/7 support
- White-label branding
- Full analytics
- Full API access

**Test Data:**
- 4 albums (130 photos)
- 2 clients: Emma Thompson, Johnson Family
- 2 people for face tagging
- 1 album design
- 2 share links
- Cloud storage: Google Drive + Dropbox

---

## Data Summary

| Metric | Total | Per Company |
|--------|-------|-------------|
| Companies | 3 | - |
| Albums | 12 | 4 |
| Photos | 470 | 130-170 |
| Clients | 6 | 2 |
| People | 6 | 2 |
| Album Designs | 3 | 1 |
| Share Links | 6 | 2 |

## Database Seeding

### Running the Seed Script

```bash
cd server
npm run db:seed
```

### Verification

```sql
-- Check all companies
SELECT 
    u.id,
    u.email,
    COUNT(DISTINCT a.id) as albums,
    COUNT(p.id) as photos
FROM users u
LEFT JOIN albums a ON u.id = a.user_id
LEFT JOIN photos p ON a.id = p.album_id
WHERE u.id >= 19
GROUP BY u.id, u.email
ORDER BY u.id;
```

### Re-seeding

To reset and re-seed the database:

```bash
# Clean existing data
docker exec luminos-postgres-1 psql -U postgres -d luminos -c "
UPDATE albums SET cover_photo_id = NULL WHERE user_id >= 19;
DELETE FROM photos WHERE album_id IN (SELECT id FROM albums WHERE user_id >= 19);
DELETE FROM albums WHERE user_id >= 19;
DELETE FROM storage_connections WHERE user_id >= 19;
DELETE FROM root_folders WHERE user_id >= 19;
DELETE FROM share_links WHERE created_by >= 19;
DELETE FROM audit_logs WHERE user_id >= 19;
DELETE FROM sync_state WHERE user_id >= 19;
DELETE FROM users WHERE id >= 19;"

# Run seed script
cd server
npm run db:seed
```

## Application Data

The seed script also generates `seed-data.json` containing:

- **Clients:** Complete contact information, addresses, social media
- **People:** Face tagging data with photo counts
- **Album Designs:** Print album templates
- **Photographer Profiles:** Company details, branding, social links
- **App Settings:** Policies, integrations, gallery defaults

## GDPR Compliance

All seed data follows GDPR principles:

✅ **Complete Data Isolation** - Each company's data is 100% separate
✅ **No Cross-Company Access** - Users can only access their own data
✅ **Separate Cloud Storage** - Independent storage connections
✅ **Independent Audit Trails** - Separate logs per company
✅ **Right to Access** - Easy data export per company
✅ **Right to Deletion** - Cascading delete removes all company data

## Security Notes

⚠️ **Important:** These test accounts are for development only:

- Never use these credentials in production
- Change all passwords before deploying
- Use environment-specific credentials
- Implement proper authentication in production
- Enable rate limiting and account lockout

## Related Documentation

- [MULTI_TENANT_ARCHITECTURE.md](MULTI_TENANT_ARCHITECTURE.md) - Multi-tenant design
- [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md) - Data protection details
- [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) - Database setup

---

**Last Updated:** December 10, 2024
**Version:** 2.1.0
