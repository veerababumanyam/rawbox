# Cloud Storage Integration Design Document

## Overview

This design document outlines the architecture and implementation approach for completing the cloud storage integration in RawBox. The system uses a hybrid storage model where media files are stored in user-owned cloud storage (Google Drive or Dropbox) while all metadata, organizational logic, and access control remain in the application's PostgreSQL database. A Redis-backed caching layer provides CDN-like performance for frequently accessed content.

The design builds upon existing OAuth authentication and basic upload functionality to add folder management, synchronization, token refresh, resumable uploads, semantic search, and comprehensive error handling.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React Frontend - Gallery Management, Upload UI)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼────────────────────────────────────────┐
│                    Application Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Express    │  │   Passport   │  │  Multer      │     │
│  │   Routes     │  │   Auth       │  │  Upload      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────────────┐
│  PostgreSQL  │ │  Redis  │ │  Cloud Providers  │
│  (Metadata)  │ │ (Cache) │ │  - Google Drive   │
│  + pgvector  │ │         │ │  - Dropbox        │
└──────────────┘ └─────────┘ └───────────────────┘
```

### Data Flow

1. **Upload Flow**: Client → Express → Cloud Provider API → Store file ID in PostgreSQL
2. **Retrieval Flow**: Client → Express → Check Redis → If miss, fetch from Cloud Provider → Cache in Redis → Return to client
3. **Sync Flow**: Background Job → Cloud Provider Change API → Update PostgreSQL → Invalidate Redis cache

## Components and Interfaces

### 1. Storage Service Layer

**Purpose**: Abstract cloud provider operations behind a unified interface

**Interface**:
```typescript
interface IStorageProvider {
  // Folder operations
  createFolder(name: string, parentId?: string): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder>;
  listFolders(parentId: string): Promise<Folder[]>;
  
  // File operations
  uploadFile(file: Buffer, name: string, mimeType: string, folderId: string): Promise<File>;
  uploadFileResumable(file: Stream, name: string, mimeType: string, folderId: string): Promise<File>;
  getFile(fileId: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;
  
  // Token management
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
  
  // Change detection
  getChanges(pageToken?: string): Promise<ChangeList>;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
}

interface File {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

interface ChangeList {
  changes: Change[];
  nextPageToken?: string;
}

interface Change {
  fileId: string;
  type: 'created' | 'modified' | 'deleted';
  file?: File;
}
```

**Implementations**:
- `GoogleDriveProvider` - Implements IStorageProvider for Google Drive
- `DropboxProvider` - Implements IStorageProvider for Dropbox

### 2. Folder Management Service

**Purpose**: Manage hierarchical folder structure in cloud storage

**Interface**:
```typescript
interface IFolderManager {
  // Initialize root folder for user
  initializeRootFolder(userId: number, provider: string): Promise<string>;
  
  // Gallery folder operations
  createGalleryFolder(userId: number, galleryId: number, galleryName: string): Promise<string>;
  createSubGalleryFolder(userId: number, parentGalleryId: number, subGalleryId: number, name: string): Promise<string>;
  
  // Folder mapping
  getFolderMapping(galleryId: number): Promise<FolderMapping>;
}

interface FolderMapping {
  galleryId: number;
  provider: string;
  providerFolderId: string;
  parentFolderId?: string;
}
```

### 3. Token Management Service

**Purpose**: Handle OAuth token lifecycle and automatic refresh

**Interface**:
```typescript
interface ITokenManager {
  // Get valid token (refresh if needed)
  getValidToken(userId: number, provider: string): Promise<string>;
  
  // Refresh token
  refreshToken(userId: number, provider: string): Promise<void>;
  
  // Check if token is expired
  isTokenExpired(expiresAt: Date): boolean;
  
  // Mark connection as invalid
  invalidateConnection(userId: number, provider: string): Promise<void>;
}
```

### 4. Sync Service

**Purpose**: Detect and reconcile external changes to cloud storage

**Interface**:
```typescript
interface ISyncService {
  // Run sync for a user
  syncUser(userId: number, provider: string): Promise<SyncResult>;
  
  // Run sync for all users (background job)
  syncAll(): Promise<void>;
  
  // Handle specific change types
  handleFileDeleted(fileId: string): Promise<void>;
  handleFileRenamed(fileId: string, newName: string): Promise<void>;
  handleFolderMoved(folderId: string, newParentId: string): Promise<void>;
}

interface SyncResult {
  filesProcessed: number;
  filesDeleted: number;
  filesUpdated: number;
  conflicts: Conflict[];
}

interface Conflict {
  type: 'folder_missing' | 'file_missing' | 'structure_broken';
  details: string;
  galleryId?: number;
  photoId?: number;
}
```

### 5. Cache Service

**Purpose**: Provide fast access to frequently requested data

**Interface**:
```typescript
interface ICacheService {
  // File URL caching
  cacheFileUrl(fileId: string, url: string, ttl: number): Promise<void>;
  getFileUrl(fileId: string): Promise<string | null>;
  invalidateFileUrl(fileId: string): Promise<void>;
  
  // Metadata caching
  cacheGalleryPhotos(galleryId: number, photos: Photo[], ttl: number): Promise<void>;
  getGalleryPhotos(galleryId: number): Promise<Photo[] | null>;
  invalidateGalleryPhotos(galleryId: number): Promise<void>;
  
  // Provider list caching
  cacheStorageProviders(userId: number, providers: Provider[], ttl: number): Promise<void>;
  getStorageProviders(userId: number): Promise<Provider[] | null>;
}
```

### 6. Vector Search Service

**Purpose**: Enable semantic search using AI-generated embeddings

**Interface**:
```typescript
interface IVectorSearchService {
  // Generate embedding for photo
  generateEmbedding(photoUrl: string): Promise<number[]>;
  
  // Store embedding
  storeEmbedding(photoId: number, embedding: number[]): Promise<void>;
  
  // Search by text query
  searchByText(query: string, userId: number, limit: number): Promise<SearchResult[]>;
  
  // Search by similar image
  searchBySimilarImage(photoId: number, limit: number): Promise<SearchResult[]>;
}

interface SearchResult {
  photoId: number;
  similarity: number;
  photo: Photo;
}
```

### 7. Rate Limiter Service

**Purpose**: Manage API request quotas and prevent exceeding limits

**Interface**:
```typescript
interface IRateLimiter {
  // Check if request can proceed
  canMakeRequest(provider: string, operation: string): Promise<boolean>;
  
  // Record request
  recordRequest(provider: string, operation: string): Promise<void>;
  
  // Get current usage
  getUsage(provider: string): Promise<UsageStats>;
  
  // Handle rate limit error
  handleRateLimitError(provider: string, retryAfter: number): Promise<void>;
}

interface UsageStats {
  requestsThisHour: number;
  quotaLimit: number;
  percentUsed: number;
}
```

### 8. Audit Logger Service

**Purpose**: Log critical operations for security and troubleshooting

**Interface**:
```typescript
interface IAuditLogger {
  // Log storage connection events
  logConnection(userId: number, provider: string, action: 'connected' | 'disconnected'): Promise<void>;
  
  // Log file operations
  logFileOperation(userId: number, fileId: string, operation: 'upload' | 'delete', metadata: any): Promise<void>;
  
  // Log sharing events
  logShareOperation(userId: number, galleryId: number, action: 'created' | 'revoked', shareToken: string): Promise<void>;
  
  // Log errors
  logError(context: string, error: Error, metadata: any): Promise<void>;
  
  // Log sync conflicts
  logConflict(userId: number, conflict: Conflict): Promise<void>;
}
```

## Data Models

### Database Schema Extensions

```sql
-- Add folder mappings table
CREATE TABLE folder_mappings (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_folder_id VARCHAR(255) NOT NULL,
  parent_folder_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gallery_id, provider)
);

-- Add root folder tracking
CREATE TABLE root_folders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_folder_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- Add vector embeddings for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE photo_embeddings (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  embedding vector(768), -- Dimension depends on AI model
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(photo_id)
);

-- Add index for vector similarity search
CREATE INDEX ON photo_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Add metadata fields to photos table
ALTER TABLE photos ADD COLUMN tags TEXT[];
ALTER TABLE photos ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE photos ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE photos ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Add share links table
CREATE TABLE share_links (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Add audit log table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON audit_logs(user_id, created_at);
CREATE INDEX ON audit_logs(action, created_at);

-- Add sync state tracking
CREATE TABLE sync_state (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  last_sync_token VARCHAR(255),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, provider)
);

-- Add connection status
ALTER TABLE storage_connections ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE storage_connections ADD COLUMN last_error TEXT;
ALTER TABLE storage_connections ADD COLUMN last_error_at TIMESTAMP WITH TIME ZONE;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Root folder initialization is idempotent
*For any* user and provider, calling initializeRootFolder multiple times should result in the same root folder ID being returned and stored, without creating duplicate folders.
**Validates: Requirements 1.1, 1.2**

### Property 2: Folder hierarchy consistency
*For any* gallery with sub-galleries, the folder structure in cloud storage should match the hierarchical relationships stored in the database, such that each sub-gallery's parent folder ID matches its parent gallery's folder ID.
**Validates: Requirements 1.3, 1.4**

### Property 3: File upload atomicity
*For any* file upload operation, either both the cloud storage upload and database record creation succeed, or neither succeeds (rollback on failure).
**Validates: Requirements 2.1, 2.2**

### Property 4: Resumable upload continuation
*For any* interrupted resumable upload, resuming the upload should continue from the last successfully uploaded chunk, not restart from the beginning.
**Validates: Requirements 2.3, 2.4**

### Property 5: Token refresh before expiry
*For any* API call, if the access token will expire within 5 minutes, the system should refresh the token before making the call.
**Validates: Requirements 4.1, 4.4**

### Property 6: Invalid token detection
*For any* API call that returns an authentication error, the system should attempt token refresh once, and if that fails, mark the connection as invalid.
**Validates: Requirements 4.3, 4.5**

### Property 7: Sync job idempotency
*For any* sync job run multiple times with the same change set, the database state should be identical after the first run and subsequent runs.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 8: Cache invalidation on update
*For any* photo that is updated or deleted, the corresponding cache entries (file URL, gallery photo list) should be invalidated immediately.
**Validates: Requirements 6.5, 8.5**

### Property 9: Vector search similarity ordering
*For any* semantic search query, results should be ordered by descending similarity score, with the most similar photos appearing first.
**Validates: Requirements 7.4**

### Property 10: Metadata independence from cloud storage
*For any* photo metadata operation (adding tags, changing sort order, setting visibility), no API calls should be made to the cloud storage provider.
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 11: Share link access control
*For any* share link access attempt, access should be granted if and only if the share token is valid, not revoked, not expired, and the password (if required) matches.
**Validates: Requirements 9.2, 9.3, 9.4, 9.5**

### Property 12: Rate limit backoff
*For any* rate limit error from a cloud provider, subsequent requests to that provider should be delayed by at least the retry-after duration specified in the error.
**Validates: Requirements 10.2, 10.3**

### Property 13: Data isolation enforcement
*For any* file access request, the system should verify that the file's album belongs to the requesting user before serving the file.
**Validates: Requirements 12.1, 12.2**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Expired tokens → Automatic refresh
   - Invalid refresh tokens → Mark connection as invalid, notify user
   - OAuth flow failures → Log error, show user-friendly message

2. **Network Errors**
   - Timeout → Retry with exponential backoff (max 3 attempts)
   - Connection refused → Retry with exponential backoff
   - DNS failures → Log error, notify user

3. **API Errors**
   - Rate limiting → Queue request, apply backoff
   - Quota exceeded → Notify admin, pause non-critical operations
   - Invalid request → Log error with request details, return 400 to client
   - Not found → Check if file was deleted externally, update database

4. **Storage Errors**
   - Insufficient space → Notify user, suggest cleanup or upgrade
   - File too large → Return clear error message with size limits
   - Invalid file type → Validate before upload, return 400

5. **Database Errors**
   - Connection failures → Retry with backoff, use connection pool
   - Constraint violations → Log error, return 409 conflict
   - Query timeouts → Optimize query, add indexes if needed

6. **Sync Conflicts**
   - Folder structure broken → Log conflict, surface in admin dashboard
   - File missing → Mark as deleted in database
   - Unexpected changes → Log for manual review

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // User-friendly message
    details?: any; // Additional context for debugging
    retryable: boolean; // Whether client should retry
  };
}
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
};
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

- **Storage Provider Tests**: Mock cloud provider APIs, test folder creation, file upload, token refresh
- **Token Manager Tests**: Test token expiry detection, refresh logic, error handling
- **Folder Manager Tests**: Test folder hierarchy creation, mapping storage and retrieval
- **Cache Service Tests**: Test cache hit/miss, TTL expiration, invalidation
- **Rate Limiter Tests**: Test quota tracking, backoff calculation, queue management
- **Sync Service Tests**: Test change detection, conflict resolution, database updates

### Property-Based Testing

Property-based tests will verify correctness properties across many random inputs using the `fast-check` library for TypeScript. Each test will run a minimum of 100 iterations.

**Testing Framework**: fast-check (https://github.com/dubzzz/fast-check)

**Property Test Structure**:
```typescript
import fc from 'fast-check';

// Example property test
test('Property 1: Root folder initialization is idempotent', () => {
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 10000 }), // userId
      fc.constantFrom('google-drive', 'dropbox'), // provider
      async (userId, provider) => {
        const folderId1 = await folderManager.initializeRootFolder(userId, provider);
        const folderId2 = await folderManager.initializeRootFolder(userId, provider);
        expect(folderId1).toBe(folderId2);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Tests to Implement**:

1. **Root folder idempotency** - Test Property 1
2. **Folder hierarchy consistency** - Test Property 2
3. **File upload atomicity** - Test Property 3
4. **Resumable upload continuation** - Test Property 4
5. **Token refresh timing** - Test Property 5
6. **Invalid token handling** - Test Property 6
7. **Sync job idempotency** - Test Property 7
8. **Cache invalidation** - Test Property 8
9. **Vector search ordering** - Test Property 9
10. **Metadata independence** - Test Property 10
11. **Share link access control** - Test Property 11
12. **Rate limit backoff** - Test Property 12
13. **Data isolation** - Test Property 13

### Integration Testing

Integration tests will verify end-to-end workflows:

- **Upload Flow**: Upload file → Verify in cloud storage → Verify in database → Verify cache
- **Sync Flow**: Modify file externally → Run sync → Verify database updated
- **Share Flow**: Create share link → Access with valid token → Verify access granted
- **Token Refresh Flow**: Expire token → Make API call → Verify token refreshed → Verify call succeeds

### Test Data Generators

For property-based testing, we'll create generators for:

```typescript
// User generator
const userGen = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  email: fc.emailAddress()
});

// File generator
const fileGen = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  mimeType: fc.constantFrom('image/jpeg', 'image/png', 'video/mp4'),
  size: fc.integer({ min: 1, max: 100 * 1024 * 1024 }) // Up to 100MB
});

// Gallery generator
const galleryGen = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  userId: fc.integer({ min: 1, max: 10000 })
});

// Share link generator
const shareLinkGen = fc.record({
  token: fc.hexaString({ minLength: 32, maxLength: 32 }),
  password: fc.option(fc.string({ minLength: 8, maxLength: 128 })),
  expiresAt: fc.option(fc.date({ min: new Date() }))
});
```

## Implementation Notes

### Technology Choices

- **Property-Based Testing Library**: fast-check for TypeScript
- **Vector Database**: PostgreSQL with pgvector extension
- **Cache**: Redis with automatic TTL and LRU eviction
- **Background Jobs**: Node-cron for scheduled sync jobs
- **File Streaming**: Node.js streams for memory-efficient uploads
- **Encryption**: crypto module with AES-256-GCM for token encryption

### Performance Considerations

- Use connection pooling for PostgreSQL (already configured)
- Implement request batching where cloud provider APIs support it
- Use Redis pipelining for bulk cache operations
- Stream large files instead of loading into memory
- Index frequently queried database columns (user_id, provider, created_at)
- Use database transactions for atomic operations

### Security Considerations

- Encrypt tokens at rest using AES-256-GCM
- Use HTTPS for all API communications
- Validate all user inputs before database queries
- Implement SQL injection prevention (parameterized queries)
- Use secure random token generation for share links
- Hash passwords using bcrypt with salt
- Implement CSRF protection for state-changing operations
- Rate limit API endpoints to prevent abuse

### Scalability Considerations

- Horizontal scaling: Stateless application servers behind load balancer
- Database read replicas for read-heavy operations
- Redis cluster for distributed caching
- Background job queue for async processing (consider Bull or BullMQ)
- CDN for serving static assets and cached media
- Partition audit logs by date for efficient querying
