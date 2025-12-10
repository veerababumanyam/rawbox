# 🚀 Quick Reference - Seed Data

## Database Access

```bash
# Connect to database
docker exec -it luminos-postgres-1 psql -U postgres -d luminos

# Quick queries
SELECT COUNT(*) FROM users;      # 3 users
SELECT COUNT(*) FROM albums;     # 30 albums
SELECT COUNT(*) FROM photos;     # 1,175+ photos
```

## Test Users

| Email | Albums | Photos | Status |
|-------|--------|--------|--------|
| sarah.photographer@example.com | 30 | 1,175 | ✅ Full data |
| mike.studios@example.com | 0 | 0 | ⏳ Ready for expansion |
| emma.creative@example.com | 0 | 0 | ⏳ Ready for expansion |

## Test Clients (in seed-data.json)

1. **Sarah & James Mitchell** - Wedding (Portland, OR)
2. **TechCorp Industries** - Corporate (San Francisco, CA)
3. **Anderson Family** - Family (Seattle, WA)

## Test Albums (Primary User)

| Album | Photos | Client |
|-------|--------|--------|
| Summer Wedding | 45 | Sarah & James Mitchell |
| Corporate Event | 60 | TechCorp Industries |
| Family Portrait | 30 | Anderson Family |
| Engagement Shoot | 35 | Maria & David |
| Birthday Party | 40 | Emma Thompson |
| Product Photos | 25 | Luxe Jewelry Co. |

## Import Application Data

```javascript
// In browser console or app initialization
const seedData = await fetch('/seed-data.json').then(r => r.json());

localStorage.setItem('clients', JSON.stringify(seedData.clients));
localStorage.setItem('people', JSON.stringify(seedData.people));
localStorage.setItem('albumDesigns', JSON.stringify(seedData.albumDesigns));
localStorage.setItem('appSettings', JSON.stringify(seedData.appSettings));
```

## Re-seed Database

```bash
docker-compose down -v
docker-compose up -d postgres redis
timeout /t 5 /nobreak
cd server
Get-Content migrations/001_cloud_storage_integration.sql | docker exec -i luminos-postgres-1 psql -U postgres -d luminos
npm run db:seed
```

## Files

- `seed-data.json` - Application data (14KB)
- `SEED_DATA_GUIDE.md` - Detailed guide
- `SEED_DATA_SUMMARY.md` - Overview
- `server/seed.ts` - Seed script

## Photo URLs

All photos use picsum.photos:
- Format: `https://picsum.photos/seed/{albumId}-{photoNum}/1200/800`
- Example: `https://picsum.photos/seed/25-1/1200/800`

## Avatars

All avatars use pravatar.cc:
- Format: `https://i.pravatar.cc/150?img={num}`
- Example: `https://i.pravatar.cc/150?img=1`

## Share Links

First 3 albums have share links:
- 30-day expiry
- No password protection
- Token format: `share_token_{albumId}_{timestamp}`

## Cloud Storage

- Providers: Google Drive, Dropbox
- Root folders configured
- Folder mappings for first 3 albums
- Sync state tracked

---

**Quick Start**: `npm run dev` → Login → Explore 30 galleries with 1,175+ photos! 🎉
