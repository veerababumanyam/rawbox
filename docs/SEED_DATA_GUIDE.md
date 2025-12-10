# RawBox Seed Data Guide

## Overview

This guide explains the comprehensive test data that has been seeded into your RawBox application for complete testing of all features.

## What Was Seeded

### Database (PostgreSQL)

The database has been populated with realistic test data across all tables:

#### 1. **Users (3 Photographers)**
- `sarah.photographer@example.com` (ID: 1)
- `mike.studios@example.com` (ID: 2)
- `emma.creative@example.com` (ID: 3)

#### 2. **Storage Connections**
Each user has connections to:
- Google Drive
- Dropbox

#### 3. **Albums/Galleries (6 per user, 30 total)**
For the first user (sarah.photographer@example.com):

1. **Summer Wedding - Sarah & James** (45 photos)
   - Client: Sarah & James Mitchell
   - Beautiful outdoor wedding ceremony at Sunset Gardens

2. **Corporate Event - Tech Summit 2024** (60 photos)
   - Client: TechCorp Industries
   - Annual technology conference with keynote speakers

3. **Family Portrait - Anderson Family** (30 photos)
   - Client: Anderson Family
   - Multi-generational family portraits at the park

4. **Engagement Photoshoot - Maria & David** (35 photos)
   - Client: Maria Rodriguez & David Chen
   - Romantic sunset engagement photos at the beach

5. **Birthday Celebration - Emma's 50th** (40 photos)
   - Client: Emma Thompson
   - Milestone birthday party with friends and family

6. **Product Photography - Artisan Jewelry** (25 photos)
   - Client: Luxe Jewelry Co.
   - High-end jewelry collection for e-commerce

**Total Photos**: 1,175+ across all albums

#### 4. **Cloud Storage Integration**
- Root folders configured for each user
- Folder mappings linking galleries to cloud storage
- Share links for the first 3 albums (30-day expiry)

#### 5. **Audit Logs**
- 10 sample audit log entries tracking various actions
- Actions include: gallery_created, photo_uploaded, share_link_created, settings_updated

#### 6. **Sync State**
- Sync state tracking for each user's cloud storage providers
- Last sync timestamps and tokens

### Application Data (JSON)

The `seed-data.json` file contains comprehensive mock data for features not stored in the database:

#### 1. **Clients (3 detailed records)**

**Client 1: Sarah & James Mitchell**
- Type: Wedding couple
- Contact: Multiple phones and emails
- Address: Portland, OR
- Social media profiles
- Tags: wedding, vip, repeat-client
- Notes: Prefer natural lighting

**Client 2: TechCorp Industries**
- Type: Corporate client
- Organization with logo
- Contact: Event coordinator Michael Chen
- Address: San Francisco, CA
- Website and social media
- Tags: corporate, annual-event, high-budget
- Notes: Needs photos within 48 hours

**Client 3: Anderson Family**
- Type: Family portraits
- Contact: Dr. Robert James Anderson
- Address: Seattle, WA
- Multiple contact methods
- Tags: family, annual-portraits, referral
- Notes: Family of 5, prefer outdoor locations

#### 2. **People (3 records for face tagging)**
- Sarah Mitchell (28 photos)
- James Mitchell (25 photos)
- Emma Thompson (32 photos)

Each person has:
- Thumbnail and cover photo URLs
- Photo count
- Creation timestamp

#### 3. **Album Designs (3 print album designs)**

**Design 1: Wedding Album - Main**
- Specs: 12x12 Square Album
- Status: Proofing
- Includes sample spread with photo and text elements
- Share token for client review

**Design 2: Corporate Event Album**
- Specs: 10x10 Square Album
- Status: Draft

**Design 3: Family Portrait Album**
- Specs: 8x8 Square Album
- Status: Draft

#### 4. **Photographer Profile**

Complete profile with:

**Personal Information:**
- Name: Sarah Photography
- Contact: Email, phone, website
- Address: Portland, OR
- Languages: English, Spanish
- Social media: Instagram, Facebook, Twitter, LinkedIn, WhatsApp, TikTok, YouTube
- Custom links: Book a Session, View Portfolio

**Company Information:**
- Name: Sarah Photography Studio
- Tagline: "Capturing Life's Beautiful Moments"
- Slug: sarah-photography
- Complete contact details
- Languages: English, Spanish, French
- Social media profiles
- Custom links: Wedding Packages, Pricing Guide

**Settings:**
- Public profile enabled
- Search engine indexing allowed
- Custom theme: "Modern Elegance" with gradient background

#### 5. **Application Settings**

- Recycle bin retention: 30 days
- Integration status (Google Drive, Dropbox, Stripe enabled)
- Gallery defaults with branding
- Policies: Terms of Service, Privacy Policy, Refund Policy

## How to Use This Data

### 1. Database Access

The database is already populated. You can query it using:

```bash
# Connect to database
docker exec -it luminos-postgres-1 psql -U postgres -d luminos

# View users
SELECT * FROM users;

# View albums
SELECT id, name, description FROM albums;

# View photos for an album
SELECT id, name, url FROM photos WHERE album_id = 25 LIMIT 10;
```

### 2. Application Data Import

The `seed-data.json` file contains data for features that may be stored in localStorage or application state. To use it:

**Option A: Manual Import**
1. Open your application
2. Open browser DevTools (F12)
3. Go to Console
4. Copy and paste the JSON data into localStorage:

```javascript
// Load the seed data
const seedData = /* paste seed-data.json content here */;

// Store in localStorage
localStorage.setItem('clients', JSON.stringify(seedData.clients));
localStorage.setItem('people', JSON.stringify(seedData.people));
localStorage.setItem('albumDesigns', JSON.stringify(seedData.albumDesigns));
localStorage.setItem('appSettings', JSON.stringify(seedData.appSettings));
```

**Option B: Programmatic Import**
Create an import function in your application:

```typescript
import seedData from './seed-data.json';

export function importSeedData() {
  localStorage.setItem('clients', JSON.stringify(seedData.clients));
  localStorage.setItem('people', JSON.stringify(seedData.people));
  localStorage.setItem('albumDesigns', JSON.stringify(seedData.albumDesigns));
  localStorage.setItem('appSettings', JSON.stringify(seedData.appSettings));
  console.log('Seed data imported successfully!');
}
```

### 3. Testing Scenarios

With this seed data, you can test:

#### Gallery Management
- View 30 pre-populated galleries
- Each gallery has 25-60 photos
- Test pagination, filtering, and search
- Test cover photo display

#### Client Management
- 3 clients with complete information
- Test client detail views
- Test contact information display
- Test social media links
- Test client notes and tags

#### People & Face Tagging
- 3 people with photo counts
- Test face detection UI
- Test person detail views
- Test photo filtering by person

#### Print Album Designer
- 3 album designs at different stages
- Test design editor with pre-configured spreads
- Test proofing workflow
- Test share links for client review

#### Photographer Profile
- Complete personal and company profiles
- Test public profile page
- Test visibility controls
- Test social media integration
- Test custom links

#### Cloud Storage Integration
- Storage connections configured
- Folder mappings set up
- Test sync status display
- Test folder navigation

#### Share Links
- 3 galleries have share links
- Test share link access
- Test expiry dates
- Test password protection (none set by default)

## Resetting the Data

If you need to reset and re-seed:

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d postgres redis

# Wait for postgres to initialize (5 seconds)
timeout /t 5 /nobreak

# Run migration
cd server
Get-Content migrations/001_cloud_storage_integration.sql | docker exec -i luminos-postgres-1 psql -U postgres -d luminos

# Run seed script
npm run db:seed
```

## Data Characteristics

### Realistic Data
- All names, addresses, and contact information are fictional but realistic
- Photos use placeholder images from picsum.photos
- Avatars use pravatar.cc for consistent profile pictures
- Dates are set to recent past for relevance

### Complete Coverage
Every field in the application has data:
- ✅ Multiple contact methods (phone, email, social media)
- ✅ Complete addresses with all fields
- ✅ Tags and notes for organization
- ✅ Multiple languages
- ✅ Custom links and branding
- ✅ Integration status
- ✅ Policies and legal documents

### Variety
- Different client types: Wedding, Corporate, Family, Individual
- Different album sizes: 25-60 photos each
- Different design specs: 8x8, 10x10, 12x12 albums
- Different statuses: Draft, Proofing, Approved

## Troubleshooting

### Database Connection Issues
If you can't connect to the database:
1. Ensure Docker containers are running: `docker ps`
2. Check postgres logs: `docker logs luminos-postgres-1`
3. Verify DATABASE_URL in `server/.env`

### Missing Data
If data is missing:
1. Check if seed script completed successfully
2. Query the database to verify: `docker exec luminos-postgres-1 psql -U postgres -d luminos -c "SELECT COUNT(*) FROM albums;"`
3. Re-run the seed script if needed

### JSON Import Issues
If JSON import fails:
1. Verify the file exists: `seed-data.json` in project root
2. Check JSON syntax is valid
3. Ensure localStorage has space available

## Next Steps

1. **Start the application**: `npm run dev`
2. **Login** with one of the seeded user emails
3. **Explore** all the pre-populated data
4. **Test** all features with realistic data
5. **Customize** the seed data for your specific testing needs

## Support

For issues or questions about the seed data:
1. Check the seed script: `server/seed.ts`
2. Review the database schema: `server/schema.sql` and `server/migrations/001_cloud_storage_integration.sql`
3. Inspect the generated JSON: `seed-data.json`

---

**Generated**: December 10, 2024
**Version**: 1.0.0
**Database**: PostgreSQL 16 (luminos)
**Total Records**: 3 users, 30 albums, 1,175+ photos, 3 clients, 3 people, 3 designs
