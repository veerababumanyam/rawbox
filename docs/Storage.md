Below is a structured set of technical requirements, written from a business‑analyst perspective, based on your description.

***

## 1. Integration Model

1.1 Cloud Storage Providers  
- The system shall integrate with Google Drive and Dropbox using their official APIs and SDKs.  
- The system shall not mount cloud storage as a traditional filesystem; instead it shall interact via RESTful API calls for all file and folder operations.  

1.2 Hybrid Storage Architecture  
- The system shall use external cloud storage (Google Drive/Dropbox) exclusively for user media files (photos, videos).  
- The system shall use the application’s own database for all metadata (galleries, albums, tags, sort order, permissions, and mappings to cloud file IDs).  

1.3 CDN Caching Layer  
- The system shall use a combination of Nginx as a reverse proxy and Redis for in-memory caching to serve frequently accessed media and metadata.  
- This architecture will function as a low-latency Content Delivery Network (CDN), reducing API calls to the primary storage and backend services, improving response times, and lowering data transfer costs.  

1.4 Vector Storage and Search  
- The system shall use PostgreSQL as its primary database, extended with the `pgvector` extension.  
- This will be used to store high-dimensional vector embeddings generated from media files (e.g., images). This capability will power advanced, AI-driven features like semantic search or "find similar images."  

1.5 Authentication and Authorization  
- The system shall use Google OAuth as the primary mechanism for user authentication and authorization.  
- This approach meets the goal of low-cost client management by delegating user credential and session management to a secure, trusted, and managed third-party service, thereby reducing internal development and maintenance overhead.


***

## 2. OAuth and Security

2.1 OAuth 2.0 Authorization  
- The system shall implement OAuth 2.0 for both Google Drive and Dropbox to obtain user consent and access tokens.  
- The system shall request the minimum set of scopes required to create, read, update, and delete files/folders created by the application.  

2.2 Token Management  
- The system shall securely store access and refresh tokens using encrypted storage.  
- The system shall automatically refresh access tokens when expired, and detect revoked/invalid refresh tokens, prompting the user to reconnect their cloud account.  

2.3 Data Isolation  
- Each cloud account’s file and folder IDs shall be strictly mapped to a single internal user ID.  
- Authorization checks shall ensure that a user can access only files and folders associated with their own account mappings.  

***

## 3. Folder & File Management

3.1 Root App Folder  
- On first connection, the system shall create (or reuse) a dedicated root folder within the user’s Google Drive/Dropbox for application data.  
- All gallery and album folders created by the application shall live under this root folder.

3.2 Gallery and Sub‑Gallery Structure  
- When a user creates a gallery, the system shall create a corresponding folder under the app root and store its provider folder ID in the local database.  
- When a user creates a sub‑gallery, the system shall create a sub‑folder within the gallery folder and store that folder ID.  
- The system shall maintain a hierarchical mapping: `User → Root Folder → Gallery Folder → Sub‑Gallery Folder → Files`.

3.3 File Uploads  
- When a user uploads a photo or video to a gallery/sub‑gallery, the system shall upload the file into the mapped folder using the provider’s upload API.  
- The system shall store the resulting file ID, file name, MIME type, and relevant metadata in the local database.  

3.4 Resumable Uploads  
- For large files, the system shall use resumable upload mechanisms provided by each API to handle network interruptions and partial uploads.  

***

## 4. Metadata & Application Database

4.1 Metadata Storage  
- The system shall store the following metadata in the local database: galleries, sub‑galleries, albums, image titles, captions, tags, sort order, visibility flags, and cloud file/folder IDs.  
- Tagging, sorting, and other organizational data shall never be stored in the cloud provider; they shall reside only in the local database.  

4.2 Lookup and Rendering  
- When a user opens a gallery, the system shall query the local database for gallery structure and associated file IDs, then use those IDs to generate URLs or API calls for thumbnails and full‑size views.  

***

## 5. Synchronization & Consistency

5.1 External Changes  
- The system shall detect when files or folders are deleted, moved, or renamed directly in Google Drive/Dropbox (outside the application).  
- The system shall use change‑tracking mechanisms (e.g., webhook notifications or delta/change‑list APIs) where available to identify modified items.  

5.2 Sync Jobs  
- The system shall run periodic background sync jobs to reconcile the local database with the state in cloud storage (e.g., mark missing files as deleted, update names where changed).  
- Conflicts (e.g., folder structure broken or moved) shall be logged and surfaced in an admin dashboard for resolution.  

5.3 File/Folder ID Management  
- The system shall treat cloud file/folder IDs as the primary identifiers for objects stored in Google Drive/Dropbox.  
- Renames or path changes shall not break mappings, as the system relies on stable IDs rather than path strings.  

***

## 6. Performance, Caching & Quotas

6.1 Caching Layer  
- The system shall implement a caching layer for frequently accessed metadata (file lists, thumbnail URLs) to reduce repeated API calls.  
- Cache invalidation rules shall take into account provider change notifications and scheduled sync jobs.  

6.2 Pagination & Batching  
- The system shall handle paginated responses from cloud APIs and implement efficient listing strategies for galleries with large numbers of files.  
- Where supported, the system shall use batch or combined requests to reduce API call count.  

6.3 Rate Limiting & Backoff  
- The system shall monitor API usage and handle provider‑imposed rate limits by queuing requests and applying exponential backoff on throttling errors.  
- User‑visible error messages shall explain when operations are temporarily limited due to API quotas.  

***

## 7. Gallery & Album Experience

7.1 Transparent Storage Abstraction  
- From the end user’s perspective, galleries and albums shall behave as if storage is local; cloud‑storage specifics shall be abstracted away by the application layer.  
- Opening a gallery shall load thumbnails and metadata without exposing raw Google Drive/Dropbox UI or URLs directly (unless explicitly designed for sharing).  

7.2 Independent Album Support  
- Each gallery shall be able to reference multiple designer albums that use the same cloud‑stored files.  
- Albums shall rely solely on metadata (layouts, spreads, selections) in the local database while reusing the underlying file IDs from the gallery folders.  

***

## 8. Sharing & Permissions (Cloud vs App)

8.1 Application‑Level Sharing  
- The system shall implement its own sharing model (links, passwords/PINs, expiry dates, visibility rules) independent of the cloud provider’s sharing settings.  
- End‑user access shall be mediated through the application, not directly through public Google Drive/Dropbox links, unless explicitly configured.  

8.2 Optional Provider Sharing  
- If direct sharing via cloud provider links is supported, the system shall manage the creation and revocation of those share links and keep them in sync with internal sharing rules.  

***

## 9. Security, Compliance & Logging

9.1 Secure Storage  
- All sensitive tokens and user identifiers shall be encrypted at rest and in transit.  
- Access to token storage shall be restricted by least‑privilege principles.  

9.2 Audit Logging  
- The system shall log critical actions involving cloud storage (connect, disconnect, upload, delete, share, permission changes) with timestamps and user identifiers.  

9.3 Compliance  
- The integration shall adhere to provider policies and any relevant data‑protection regulations (e.g., ensuring users can disconnect storage and request removal of metadata and cached copies).  

***

These requirements should give your engineering team a clear, implementation‑ready view of how to integrate Google Drive/Dropbox as user‑owned storage while your application remains the source of truth for all gallery/album logic and metadata.