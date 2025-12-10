# RawBox Server - Cloud Storage Integration

This is the Node.js/Express backend for RawBox photo gallery application with complete cloud storage integration.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migration
psql -d rawbox -f migrations/001_cloud_storage_integration.sql

# Start Redis (using Docker)
docker-compose up redis -d

# Start development server
npm run dev
```

## Project Structure

```
server/
├── index.ts                    # Main Express application
├── db.ts                       # PostgreSQL connection pool
├── redis-service.ts            # Redis client setup
├── passport-setup.ts           # Passport.js configuration
├── drive-service.ts            # Google Drive OAuth setup
├── dropbox-service.ts          # Dropbox OAuth setup
├── types/
│   └── storage.ts              # TypeScript interfaces for storage providers
├── services/
│   ├── GoogleDriveProvider.ts  # Google Drive implementation
│   ├── DropboxProvider.ts      # Dropbox implementation
│   ├── FolderManager.ts        # Folder hierarchy management
│   ├── TokenManager.ts         # OAuth token management
│   ├── CacheService.ts         # Redis caching layer
│   ├── VectorSearchService.ts  # Semantic search with Gemini AI
│   ├── RateLimiter.ts          # Rate limiting & quotas
│   ├── AuditLogger.ts          # Audit log service
│   └── SyncService.ts          # Background sync job
├── utils/
│   ├── retry.ts                # Retry logic with exponential backoff
│   └── encryption.ts           # Token encryption utilities
└── migrations/
    └── 001_cloud_storage_integration.sql  # Database schema

```

## Core Services

### VectorSearchService
AI-powered semantic photo search using Google Gemini embeddings.

```typescript
const vectorSearch = new VectorSearchService();

// Search by text query
const results = await vectorSearch.searchByText("sunset beach", userId, 20, 0.7);

// Find similar images
const similar = await vectorSearch.searchBySimilarImage(photoId, userId, 20, 0.7);

// Generate embedding for a photo
await vectorSearch.generatePhotoEmbedding(photoId, "photo_name.jpg", "description");
```

### RateLimiter
Prevent quota exceeded errors from cloud storage providers.

```typescript
const rateLimiter = new RateLimiter();

// Check if request can proceed
const canProceed = await rateLimiter.canMakeRequest('google-drive', 'upload');

// Record a successful request
await rateLimiter.recordRequest('google-drive', 'upload');

// Get usage statistics
const usage = await rateLimiter.getUsage('google-drive', 'upload');
// Returns: { requestsThisHour, quotaLimit, percentUsed }
```

### CacheService
Redis-based caching with automatic invalidation.

```typescript
const cache = new CacheService();

// Cache gallery photos
await cache.cacheGalleryPhotos(albumId, photos, 3600);

// Get cached photos
const photos = await cache.getGalleryPhotos(albumId);

// Invalidate cache on update
await cache.invalidateGalleryPhotos(albumId);
```

### AuditLogger
Comprehensive audit trail for compliance.

```typescript
const logger = new AuditLogger();

// Log file operations
await logger.logFileOperation(userId, fileId, 'upload', metadata, ipAddress);

// Log share operations
await logger.logShareOperation(userId, galleryId, 'create', metadata, ipAddress);

// Log errors
await logger.logError('operation_name', error, context, userId, ipAddress);
```

## API Endpoints Reference

### Authentication & Storage
```
POST   /auth/google                    # Google OAuth login
GET    /auth/google-drive               # Connect Google Drive
GET    /auth/google-drive/callback      # OAuth callback
GET    /auth/dropbox                    # Connect Dropbox
GET    /auth/dropbox/callback           # OAuth callback
GET    /api/storage-providers           # List connected providers
GET    /api/current_user                # Get current user
GET    /api/logout                      # Logout
```

### File Operations
```
POST   /api/upload                      # Upload photo to cloud storage
DELETE /api/photos/:photoId             # Soft delete photo
```

### Metadata Management
```
PATCH  /api/photos/:photoId/tags        # Update photo tags
PATCH  /api/photos/:photoId/sort-order  # Set custom sort order
PATCH  /api/photos/:photoId/visibility  # Show/hide photo
```

### Semantic Search
```
GET    /api/search/text                 # Text-based semantic search
GET    /api/search/similar/:photoId     # Find similar images
```

### Galleries
```
GET    /api/albums                      # List user's albums
GET    /api/albums/:id                  # Get album with photos
POST   /api/albums                      # Create new album
```

### Share Links
```
POST   /api/share-links                 # Create share link
GET    /api/shared/:shareToken          # Access shared gallery (public)
DELETE /api/share-links/:shareToken     # Revoke share link
```

### Monitoring
```
GET    /api/rate-limits                 # Rate limit usage dashboard
GET    /api/health                      # Health check endpoint
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rawbox

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=your-session-secret-here

# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google-drive/callback

# Dropbox OAuth
DROPBOX_APP_KEY=your-app-key
DROPBOX_APP_SECRET=your-app-secret
DROPBOX_REDIRECT_URI=http://localhost:3000/auth/dropbox/callback

# Gemini AI (optional - for semantic search)
GEMINI_API_KEY=your-gemini-api-key

# Token Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

## Database Setup

### Create Database
```sql
CREATE DATABASE rawbox;
CREATE USER rawbox_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rawbox TO rawbox_user;
```

### Enable pgvector Extension
```sql
\c rawbox
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run Migrations
```bash
psql -d rawbox -U rawbox_user -f migrations/001_cloud_storage_integration.sql
```

## Redis Setup

Using Docker:
```bash
docker run -d -p 6379:6379 --name rawbox-redis redis:7-alpine
```

Or using docker-compose:
```bash
docker-compose up redis -d
```

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Enable HTTPS** - Use TLS 1.2+ in production
3. **Rate limiting** - Already implemented, configure quotas as needed
4. **Token encryption** - Tokens are encrypted at rest with AES-256-GCM
5. **Audit logging** - All critical operations are logged
6. **Input validation** - All endpoints validate input
7. **Ownership verification** - All operations check user ownership

## Troubleshooting

### "Vector search not available"
- Add `GEMINI_API_KEY` to your .env file
- Service gracefully degrades without it

### "Rate limit exceeded"
- Check `/api/rate-limits` for usage statistics
- Wait for quota to reset (hourly/daily)
- Increase quotas in `RateLimiter.ts` if needed

### "Token expired"
- Tokens auto-refresh on use
- Reconnect provider if issues persist

### "Cache not working"
- Verify Redis is running: `redis-cli ping`
- Check connection via `/api/health`

### "Database connection failed"
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure pgvector extension is installed

## Performance Tuning

### Database Indexes
All necessary indexes are created by the migration, including:
- `idx_photo_embeddings_vector` (IVFFlat for vector search)
- `idx_photos_deleted` (for filtering deleted photos)
- `idx_photos_sort` (for custom ordering)
- And more...

### Redis Configuration
Adjust TTL values in `CacheService.ts`:
```typescript
private readonly DEFAULT_TTL = 3600; // 1 hour
```

### Rate Limits
Adjust provider quotas in `RateLimiter.ts`:
```typescript
const PROVIDER_QUOTAS: Record<string, ProviderQuota> = {
  'google-drive': {
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  // ...
};
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-10T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Rate Limit Dashboard
```bash
curl http://localhost:3000/api/rate-limits \
  -H "Cookie: your-session-cookie"
```

Returns:
```json
{
  "providers": [
    {
      "provider": "google-drive",
      "usage": {
        "requestsThisHour": 45,
        "quotaLimit": 1000,
        "percentUsed": 4.5,
        "status": "normal"
      }
    }
  ]
}
```

## Contributing

1. Create a feature branch
2. Make changes with proper TypeScript types
3. Add tests if applicable
4. Update documentation
5. Submit pull request

## License

Proprietary - RawBox Photo Gallery Application

## Support

For issues and questions:
- Check [CLOUD_STORAGE_INTEGRATION_COMPLETE.md](../docs/CLOUD_STORAGE_INTEGRATION_COMPLETE.md)
- Review API endpoint documentation above
- Check troubleshooting section
