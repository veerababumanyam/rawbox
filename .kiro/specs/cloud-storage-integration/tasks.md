# Implementation Plan

- [x] 1. Set up database schema extensions and pgvector ✅
  - Create migration file for new tables (folder_mappings, root_folders, photo_embeddings, share_links, audit_logs, sync_state)
  - Add pgvector extension to PostgreSQL
  - Add new columns to existing tables (photos, storage_connections)
  - Create indexes for performance optimization
  - _Requirements: 1.1, 5.1, 7.2, 8.1, 9.1, 11.1, 12.4_
  - **Files: `server/migrations/001_cloud_storage_integration.sql`, `docker-compose.yml`**

- [x] 2. Implement storage provider abstraction layer ✅
  - [x] 2.1 Create IStorageProvider interface ✅
    - Define interface with folder operations, file operations, token management, and change detection methods
    - _Requirements: 1.1, 2.1, 4.1, 5.1_
    - **Files: `server/types/storage.ts`**

  - [x] 2.2 Implement GoogleDriveProvider class ✅
    - Implement all IStorageProvider methods for Google Drive API
    - Add folder creation, file upload, resumable upload, and change detection
    - _Requirements: 1.1, 2.1, 2.3, 5.1_
    - **Files: `server/services/GoogleDriveProvider.ts`**

  - [ ] 2.3 Write property test for GoogleDriveProvider
    - **Property 1: Root folder initialization is idempotent**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.4 Implement DropboxProvider class ✅
    - Implement all IStorageProvider methods for Dropbox API
    - Add folder creation, file upload (simple and session-based), and change detection
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 5.1_
    - **Files: `server/services/DropboxProvider.ts`**

  - [ ] 2.5 Write property test for DropboxProvider
    - **Property 1: Root folder initialization is idempotent**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 2.6 Write property test for provider consistency
    - **Property 3: File upload atomicity**
    - **Validates: Requirements 2.1, 2.2**

- [x] 3. Implement folder management service ✅
  - [x] 3.1 Create FolderManager class ✅
    - Implement initializeRootFolder method
    - Implement createGalleryFolder and createSubGalleryFolder methods
    - Implement getFolderMapping method
    - Add database operations for folder_mappings and root_folders tables
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
    - **Files: `server/services/FolderManager.ts`**

  - [ ] 3.2 Write property test for folder hierarchy
    - **Property 2: Folder hierarchy consistency**
    - **Validates: Requirements 1.3, 1.4**

  - [ ] 3.3 Write property test for folder creation retry
    - **Property: Folder creation retry with exponential backoff**
    - **Validates: Requirements 1.5**

- [x] 4. Implement token management service ✅
  - [x] 4.1 Create TokenManager class ✅
    - Implement getValidToken method with expiry checking
    - Implement refreshToken method for both Google Drive and Dropbox
    - Implement isTokenExpired helper method
    - Implement invalidateConnection method
    - Add token encryption/decryption using AES-256-GCM
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 12.4_
    - **Files: `server/services/TokenManager.ts`, `server/utils/encryption.ts`**

  - [ ] 4.2 Write property test for token refresh timing
    - **Property 5: Token refresh before expiry**
    - **Validates: Requirements 4.1, 4.4**

  - [ ] 4.3 Write property test for invalid token handling
    - **Property 6: Invalid token detection**
    - **Validates: Requirements 4.3, 4.5**

  - [ ] 4.4 Write property test for token encryption
    - **Property 12: Data isolation enforcement (token encryption)**
    - **Validates: Requirements 12.4**

- [x] 5. Implement resumable upload functionality ✅
  - [x] 5.1 Add resumable upload to GoogleDriveProvider ✅
    - Implement uploadFileResumable method using Google Drive resumable upload API
    - Add chunk tracking and resume logic
    - _Requirements: 2.3, 2.4_
    - **Files: `server/services/GoogleDriveProvider.ts`**

  - [x] 5.2 Add resumable upload to DropboxProvider ✅
    - Implement uploadFileResumable method using Dropbox upload session API
    - Add chunk tracking and resume logic
    - _Requirements: 2.3, 2.4, 3.2_
    - **Files: `server/services/DropboxProvider.ts`**

  - [ ] 5.3 Write property test for resumable uploads
    - **Property 4: Resumable upload continuation**
    - **Validates: Requirements 2.3, 2.4**

- [x] 6. Update file upload endpoint with new functionality ✅
  - [x] 6.1 Integrate FolderManager into upload endpoint ✅
    - Ensure files are uploaded to correct gallery folders
    - Add folder creation if needed
    - _Requirements: 1.3, 2.1_

  - [x] 6.2 Add Dropbox upload implementation ✅
    - Replace "not yet implemented" with actual Dropbox upload logic
    - Use simple upload for files < 150MB, session upload for larger files
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.3 Add resumable upload support ✅
    - Detect large files (> 10MB) and use resumable upload
    - Add upload progress tracking
    - _Requirements: 2.3, 2.4_

  - [x] 6.4 Integrate TokenManager for automatic token refresh ✅
    - Check token expiry before upload
    - Refresh token if needed
    - _Requirements: 4.1, 4.4_
    - **Files: `server/index.ts` (updated /api/upload endpoint)**

  - [ ] 6.5 Write property test for upload error handling
    - **Property: Upload failure after retries**
    - **Validates: Requirements 2.5**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement sync service for change detection ✅
  - [x] 8.1 Create SyncService class ✅
    - Implement syncUser method to process changes for a user
    - Implement syncAll method for background job
    - Implement change handlers (handleFileDeleted, handleFileRenamed, handleFolderMoved)
    - Add sync_state table operations for tracking sync tokens
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
    - **Files: `server/services/SyncService.ts`**

  - [x] 8.2 Add background sync job using node-cron ✅
    - Schedule sync job to run every hour
    - Add job configuration and error handling
    - _Requirements: 5.1_
    - **Files: `server/services/SyncService.ts` (startSyncJob method)**

  - [ ] 8.3 Write property test for sync idempotency
    - **Property 7: Sync job idempotency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ] 8.4 Write property test for sync conflict logging
    - **Property: Sync conflict detection and logging**
    - **Validates: Requirements 5.5**

- [x] 9. Implement cache service with Redis ✅
  - [x] 9.1 Create CacheService class ✅
    - Implement file URL caching methods
    - Implement gallery photos caching methods
    - Implement storage providers caching methods
    - Add TTL management and cache invalidation
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
    - **Files: `server/services/CacheService.ts`**

  - [ ] 9.2 Integrate cache into file retrieval endpoints
    - Check cache before fetching from cloud provider
    - Cache results after fetching
    - _Requirements: 6.1, 6.3_

  - [ ] 9.3 Add cache invalidation to update operations
    - Invalidate cache when photos are updated or deleted
    - Invalidate cache when metadata is updated
    - _Requirements: 6.5, 8.5_

  - [ ] 9.4 Write property test for cache invalidation
    - **Property 8: Cache invalidation on update**
    - **Validates: Requirements 6.5, 8.5**

  - [ ] 9.5 Write property test for cache TTL
    - **Property: Cache TTL expiration**
    - **Validates: Requirements 6.2**

- [ ] 10. Implement vector search service with pgvector
  - [ ] 10.1 Create VectorSearchService class
    - Implement generateEmbedding method using Gemini AI
    - Implement storeEmbedding method with pgvector
    - Implement searchByText method with vector similarity
    - Implement searchBySimilarImage method
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 10.2 Integrate vector generation into upload flow
    - Generate embeddings after successful upload
    - Handle embedding generation failures gracefully
    - _Requirements: 7.1, 7.5_

  - [ ] 10.3 Add semantic search API endpoint
    - Create endpoint for text-based semantic search
    - Create endpoint for similar image search
    - _Requirements: 7.3, 7.4_

  - [ ] 10.4 Write property test for vector search ordering
    - **Property 9: Vector search similarity ordering**
    - **Validates: Requirements 7.4**

  - [ ] 10.5 Write property test for embedding generation failure
    - **Property: Graceful degradation on embedding failure**
    - **Validates: Requirements 7.5**

- [ ] 11. Implement metadata management
  - [ ] 11.1 Add metadata fields to photos table (already in schema)
    - Verify tags, sort_order, is_hidden, deleted_at columns exist
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 11.2 Create metadata API endpoints
    - Add endpoint for adding/removing tags
    - Add endpoint for setting sort order
    - Add endpoint for setting visibility
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 11.3 Update gallery query endpoint to apply metadata filters
    - Apply tag filters
    - Apply sort order
    - Apply visibility filters
    - _Requirements: 8.4_

  - [ ] 11.4 Write property test for metadata independence
    - **Property 10: Metadata independence from cloud storage**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement share link functionality
  - [ ] 13.1 Create share link generation endpoint
    - Generate unique share tokens using crypto.randomBytes
    - Hash passwords using bcrypt
    - Store share link in database
    - _Requirements: 9.1, 9.2_

  - [ ] 13.2 Create share link access endpoint
    - Verify share token validity
    - Check expiry date
    - Verify password if required
    - Return gallery data if authorized
    - _Requirements: 9.3, 9.4_

  - [ ] 13.3 Create share link revocation endpoint
    - Mark share link as revoked
    - Invalidate cached permissions
    - _Requirements: 9.5_

  - [ ] 13.4 Write property test for share link access control
    - **Property 11: Share link access control**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5**

  - [ ] 13.5 Write property test for password hashing
    - **Property: Password hashing for share links**
    - **Validates: Requirements 9.2**

- [x] 14. Implement rate limiter service ✅
  - [x] 14.1 Create RateLimiter class ✅
    - Implement request tracking per provider
    - Implement quota checking
    - Implement exponential backoff logic
    - Add request queue for rate-limited operations
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
    - **Files: `server/services/RateLimiter.ts`**

  - [ ] 14.2 Integrate rate limiter into storage provider calls
    - Check rate limits before API calls
    - Record requests after API calls
    - Handle rate limit errors with backoff
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 14.3 Add rate limit monitoring and logging
    - Log warnings when approaching limits
    - Track usage statistics
    - _Requirements: 10.4_

  - [ ] 14.4 Write property test for rate limit backoff
    - **Property 12: Rate limit backoff**
    - **Validates: Requirements 10.2, 10.3**

  - [ ] 14.5 Write property test for operation prioritization
    - **Property: Critical operation prioritization**
    - **Validates: Requirements 10.5**

- [x] 15. Implement audit logging service ✅
  - [x] 15.1 Create AuditLogger class ✅
    - Implement logConnection method
    - Implement logFileOperation method
    - Implement logShareOperation method
    - Implement logError method
    - Implement logConflict method
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
    - **Files: `server/services/AuditLogger.ts`**

  - [ ] 15.2 Integrate audit logging throughout the application
    - Add logging to storage connection endpoints
    - Add logging to file upload/delete endpoints
    - Add logging to share link endpoints
    - Add logging to error handlers
    - Add logging to sync service
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 15.3 Write property test for audit logging
    - **Property: Audit log completeness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 16. Implement data isolation and security checks
  - [ ] 16.1 Add ownership verification middleware
    - Create middleware to verify file ownership
    - Create middleware to verify gallery ownership
    - _Requirements: 12.1, 12.2_

  - [ ] 16.2 Add share token verification middleware
    - Create middleware to verify share tokens
    - Check token validity, expiry, and password
    - _Requirements: 12.3_

  - [ ] 16.3 Ensure HTTPS/TLS for all API endpoints
    - Configure Express to enforce HTTPS
    - Verify TLS 1.2+ is used
    - _Requirements: 12.5_

  - [ ] 16.4 Write property test for data isolation
    - **Property 13: Data isolation enforcement**
    - **Validates: Requirements 12.1, 12.2**

  - [ ] 16.5 Write property test for share token verification
    - **Property: Share token verification**
    - **Validates: Requirements 12.3**

- [x] 17. Add error handling and retry logic ✅
  - [x] 17.1 Create retry utility with exponential backoff ✅
    - Implement configurable retry logic
    - Add exponential backoff calculation
    - _Requirements: 1.5, 2.5, 4.5_
    - **Files: `server/utils/retry.ts`**

  - [ ] 17.2 Add error handling to all storage operations
    - Wrap API calls with retry logic
    - Add specific error handlers for different error types
    - Return user-friendly error messages
    - _Requirements: 1.5, 2.5, 4.5_

  - [ ] 17.3 Add error logging to all error handlers
    - Log errors with context and stack traces
    - _Requirements: 11.4_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Update API documentation
  - Document all new endpoints
  - Add request/response examples
  - Document error codes and messages
  - _Requirements: All_

- [ ] 20. Performance optimization
  - Add database indexes for frequently queried columns
  - Optimize vector search queries
  - Configure Redis cache eviction policy
  - Test with large datasets (1000+ photos)
  - _Requirements: 6.4, 7.4_
