# Requirements Document

## Introduction

This specification defines the requirements for completing the cloud storage integration feature for RawBox. The system currently has basic OAuth and file upload capabilities for Google Drive and Dropbox. This spec covers the remaining functionality needed to provide a complete, production-ready cloud storage solution that uses external storage for media files while maintaining all metadata and organizational logic in the application database.

## Glossary

- **Cloud Storage Provider**: External storage service (Google Drive or Dropbox) used to store user media files
- **Storage System**: The complete RawBox storage architecture including cloud providers, local database, and caching layer
- **Root App Folder**: Dedicated folder in user's cloud storage containing all RawBox application data
- **Gallery Folder**: Cloud folder corresponding to a RawBox gallery
- **Provider File ID**: Unique identifier assigned by cloud provider to files and folders
- **Access Token**: Short-lived OAuth token for API access
- **Refresh Token**: Long-lived OAuth token used to obtain new access tokens
- **Sync Job**: Background process that reconciles local database with cloud storage state
- **CDN Layer**: Nginx and Redis caching infrastructure for serving media
- **Vector Embedding**: High-dimensional numerical representation of media for semantic search

## Requirements

### Requirement 1

**User Story:** As a photographer, I want my cloud storage to be automatically organized into a dedicated RawBox folder structure, so that my application data is separate from my personal files.

#### Acceptance Criteria

1. WHEN a user first connects a cloud storage provider THEN the Storage System SHALL create a dedicated root folder named "RawBox" in the user's cloud storage
2. WHEN the root folder already exists THEN the Storage System SHALL reuse the existing folder and store its provider file ID
3. WHEN a user creates a gallery THEN the Storage System SHALL create a corresponding folder under the root folder and store the provider folder ID in the database
4. WHEN a user creates a sub-gallery THEN the Storage System SHALL create a sub-folder within the parent gallery folder and maintain the hierarchical mapping
5. WHEN folder creation fails THEN the Storage System SHALL retry with exponential backoff and log the error for admin review

### Requirement 2

**User Story:** As a photographer, I want to upload photos and videos to my galleries, so that I can organize and share my work with clients.

#### Acceptance Criteria

1. WHEN a user uploads a file to a gallery THEN the Storage System SHALL upload the file to the corresponding cloud folder using the provider's API
2. WHEN a file upload completes THEN the Storage System SHALL store the provider file ID, filename, MIME type, and size in the local database
3. WHEN uploading a file larger than 10MB THEN the Storage System SHALL use the provider's resumable upload mechanism
4. WHEN a resumable upload is interrupted THEN the Storage System SHALL resume from the last successful chunk
5. WHEN a file upload fails after 3 retry attempts THEN the Storage System SHALL mark the upload as failed and notify the user

### Requirement 3

**User Story:** As a photographer, I want Dropbox file uploads to work seamlessly, so that I have flexibility in choosing my storage provider.

#### Acceptance Criteria

1. WHEN a user uploads a file to Dropbox THEN the Storage System SHALL use the Dropbox files/upload API for files under 150MB
2. WHEN a user uploads a file larger than 150MB to Dropbox THEN the Storage System SHALL use the Dropbox upload session API
3. WHEN a Dropbox upload completes THEN the Storage System SHALL store the file metadata in the same format as Google Drive uploads
4. WHEN a Dropbox API error occurs THEN the Storage System SHALL handle it with the same retry logic as Google Drive

### Requirement 4

**User Story:** As a photographer, I want my access tokens to be automatically refreshed, so that I don't have to manually reconnect my storage accounts.

#### Acceptance Criteria

1. WHEN an access token expires THEN the Storage System SHALL automatically use the refresh token to obtain a new access token
2. WHEN a new access token is obtained THEN the Storage System SHALL update the database with the new token and expiry time
3. WHEN a refresh token is invalid or revoked THEN the Storage System SHALL mark the connection as disconnected and prompt the user to reconnect
4. WHEN making any API call THEN the Storage System SHALL check token expiry and refresh if needed before the call
5. WHEN token refresh fails after 3 attempts THEN the Storage System SHALL notify the user and disable the storage connection

### Requirement 5

**User Story:** As a photographer, I want the system to detect when I move or delete files directly in my cloud storage, so that my galleries stay in sync.

#### Acceptance Criteria

1. WHEN the Storage System runs a sync job THEN it SHALL query the cloud provider's change detection API for modified items
2. WHEN a file is deleted in cloud storage THEN the sync job SHALL mark the corresponding photo record as deleted in the database
3. WHEN a folder is moved in cloud storage THEN the sync job SHALL update the folder mappings in the database
4. WHEN a file is renamed in cloud storage THEN the sync job SHALL update the filename in the database while preserving the provider file ID
5. WHEN sync conflicts occur THEN the Storage System SHALL log the conflicts and surface them in an admin dashboard

### Requirement 6

**User Story:** As a photographer, I want frequently accessed photos to load quickly, so that my clients have a smooth viewing experience.

#### Acceptance Criteria

1. WHEN a photo is requested THEN the Storage System SHALL check Redis cache before making a cloud API call
2. WHEN a photo URL is cached THEN the Storage System SHALL serve it from cache with a maximum age of 1 hour
3. WHEN a photo is not in cache THEN the Storage System SHALL fetch it from the cloud provider and cache the result
4. WHEN cache memory exceeds 80 percent capacity THEN the Storage System SHALL evict least recently used entries
5. WHEN a photo is updated or deleted THEN the Storage System SHALL invalidate the corresponding cache entry

### Requirement 7

**User Story:** As a photographer, I want to search for photos using natural language descriptions, so that I can quickly find specific images.

#### Acceptance Criteria

1. WHEN a photo is uploaded THEN the Storage System SHALL generate a vector embedding using AI analysis
2. WHEN vector embeddings are generated THEN the Storage System SHALL store them in PostgreSQL using the pgvector extension
3. WHEN a user performs a semantic search THEN the Storage System SHALL convert the query to a vector and find similar embeddings
4. WHEN search results are returned THEN the Storage System SHALL rank them by vector similarity score
5. WHEN vector generation fails THEN the Storage System SHALL log the error and allow the photo to be uploaded without semantic search capability

### Requirement 8

**User Story:** As a photographer, I want to add tags and organize my photos, so that I can categorize my work effectively.

#### Acceptance Criteria

1. WHEN a user adds a tag to a photo THEN the Storage System SHALL store the tag in the local database without modifying cloud storage
2. WHEN a user sets a custom sort order for gallery photos THEN the Storage System SHALL store the sort order in the database
3. WHEN a user marks a photo as hidden THEN the Storage System SHALL update the visibility flag in the database
4. WHEN a user queries gallery photos THEN the Storage System SHALL apply tags, sort order, and visibility filters from the database
5. WHEN metadata is updated THEN the Storage System SHALL invalidate relevant cache entries

### Requirement 9

**User Story:** As a photographer, I want to share galleries with clients using secure links, so that I control access independently of my cloud storage settings.

#### Acceptance Criteria

1. WHEN a user creates a share link THEN the Storage System SHALL generate a unique token and store sharing rules in the database
2. WHEN a share link includes a password THEN the Storage System SHALL hash the password before storing it
3. WHEN a share link has an expiry date THEN the Storage System SHALL reject access attempts after expiration
4. WHEN a client accesses a shared gallery THEN the Storage System SHALL verify the share token before serving media URLs
5. WHEN a user revokes a share link THEN the Storage System SHALL immediately disable access and invalidate cached permissions

### Requirement 10

**User Story:** As a system administrator, I want API usage to be monitored and rate-limited, so that we don't exceed cloud provider quotas.

#### Acceptance Criteria

1. WHEN the Storage System makes API calls THEN it SHALL track the request count per provider per hour
2. WHEN approaching rate limits THEN the Storage System SHALL queue requests and apply exponential backoff
3. WHEN a rate limit error is received THEN the Storage System SHALL pause requests for the specified retry-after duration
4. WHEN rate limits are consistently hit THEN the Storage System SHALL log warnings for capacity planning
5. WHEN critical operations are queued THEN the Storage System SHALL prioritize them over background sync jobs

### Requirement 11

**User Story:** As a system administrator, I want all critical storage operations to be logged, so that I can audit activity and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a user connects or disconnects storage THEN the Storage System SHALL log the action with user ID and timestamp
2. WHEN files are uploaded or deleted THEN the Storage System SHALL log the operation with file ID and user ID
3. WHEN share links are created or revoked THEN the Storage System SHALL log the action with share token and user ID
4. WHEN API errors occur THEN the Storage System SHALL log the error with request details and stack trace
5. WHEN sync conflicts are detected THEN the Storage System SHALL log the conflict details for admin review

### Requirement 12

**User Story:** As a photographer, I want to ensure my data is secure and isolated, so that other users cannot access my files.

#### Acceptance Criteria

1. WHEN a user requests a file THEN the Storage System SHALL verify the file belongs to the requesting user before serving it
2. WHEN a user queries galleries THEN the Storage System SHALL filter results to only include galleries owned by that user
3. WHEN a user accesses a shared gallery THEN the Storage System SHALL verify the share token matches the gallery before granting access
4. WHEN storage tokens are stored THEN the Storage System SHALL encrypt them at rest using AES-256
5. WHEN storage tokens are transmitted THEN the Storage System SHALL use HTTPS with TLS 1.2 or higher
