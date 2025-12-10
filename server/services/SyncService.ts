// Sync service for detecting and reconciling cloud storage changes
import pool from '../db';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import { DropboxProvider } from './DropboxProvider';
import { TokenManager } from './TokenManager';
import { AuditLogger } from './AuditLogger';
import { CacheService } from './CacheService';
import cron from 'node-cron';

export interface SyncResult {
  filesProcessed: number;
  filesDeleted: number;
  filesUpdated: number;
  conflicts: Conflict[];
}

export interface Conflict {
  type: 'folder_missing' | 'file_missing' | 'structure_broken';
  details: string;
  galleryId?: number;
  photoId?: number;
}

export class SyncService {
  private tokenManager: TokenManager;
  private auditLogger: AuditLogger;
  private cacheService: CacheService;
  private isSyncing = false;

  constructor() {
    this.tokenManager = new TokenManager();
    this.auditLogger = new AuditLogger();
    this.cacheService = new CacheService();
  }

  /**
   * Sync changes for a specific user and provider
   */
  async syncUser(userId: number, provider: string): Promise<SyncResult> {
    const result: SyncResult = {
      filesProcessed: 0,
      filesDeleted: 0,
      filesUpdated: 0,
      conflicts: [],
    };

    try {
      // Get sync state
      const syncStateResult = await pool.query(
        'SELECT last_sync_token FROM sync_state WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      const lastSyncToken = syncStateResult.rows[0]?.last_sync_token;

      // Get valid access token
      const accessToken = await this.tokenManager.getValidToken(userId, provider);

      // Get storage connection for refresh token
      const connectionResult = await pool.query(
        'SELECT refresh_token FROM storage_connections WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      if (connectionResult.rows.length === 0) {
        throw new Error('Storage connection not found');
      }

      const refreshToken = connectionResult.rows[0].refresh_token;

      // Get storage provider
      let storageProvider;
      if (provider === 'google-drive') {
        storageProvider = new GoogleDriveProvider(accessToken, refreshToken);
      } else if (provider === 'dropbox') {
        storageProvider = new DropboxProvider(accessToken);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Get changes from provider
      const changeList = await storageProvider.getChanges(lastSyncToken);

      // Process changes
      for (const change of changeList.changes) {
        result.filesProcessed++;

        switch (change.type) {
          case 'deleted':
            await this.handleFileDeleted(change.fileId, userId);
            result.filesDeleted++;
            break;

          case 'renamed':
            if (change.newName) {
              await this.handleFileRenamed(change.fileId, change.newName, userId);
              result.filesUpdated++;
            }
            break;

          case 'moved':
            if (change.newParentId) {
              await this.handleFolderMoved(change.fileId, change.newParentId, userId);
              result.filesUpdated++;
            }
            break;

          case 'modified':
            // For modified files, we might want to update metadata
            result.filesUpdated++;
            break;
        }
      }

      // Update sync state
      await pool.query(
        `INSERT INTO sync_state (user_id, provider, last_sync_token, last_sync_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, provider)
         DO UPDATE SET last_sync_token = EXCLUDED.last_sync_token, last_sync_at = EXCLUDED.last_sync_at`,
        [userId, provider, changeList.nextPageToken || lastSyncToken]
      );

      // Log sync conflicts
      for (const conflict of result.conflicts) {
        await this.auditLogger.logConflict(userId, conflict);
      }

      return result;
    } catch (error) {
      await this.auditLogger.logError('sync_user', error as Error, { userId, provider });
      throw error;
    }
  }

  /**
   * Sync all users (for background job)
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;

    try {
      // Get all active storage connections
      const connections = await pool.query(
        'SELECT DISTINCT user_id, provider FROM storage_connections WHERE status = $1',
        ['active']
      );

      console.log(`Starting sync for ${connections.rows.length} connections`);

      for (const connection of connections.rows) {
        try {
          const result = await this.syncUser(connection.user_id, connection.provider);
          console.log(
            `Synced user ${connection.user_id} (${connection.provider}): ` +
            `${result.filesProcessed} processed, ${result.filesDeleted} deleted, ` +
            `${result.filesUpdated} updated, ${result.conflicts.length} conflicts`
          );
        } catch (error) {
          console.error(
            `Failed to sync user ${connection.user_id} (${connection.provider}):`,
            error
          );
        }
      }

      console.log('Sync completed for all users');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Handle deleted file
   */
  async handleFileDeleted(fileId: string, userId: number): Promise<void> {
    // Mark photo as deleted (soft delete)
    const result = await pool.query(
      `UPDATE photos
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE provider_file_id = $1
       AND album_id IN (SELECT id FROM albums WHERE user_id = $2)
       RETURNING id, album_id`,
      [fileId, userId]
    );

    if (result.rows.length > 0) {
      const photoId = result.rows[0].id;
      const albumId = result.rows[0].album_id;

      // Invalidate caches
      await this.cacheService.invalidateFileUrl(fileId);
      await this.cacheService.invalidateGalleryPhotos(albumId);

      // Log the deletion
      await this.auditLogger.logFileOperation(userId, fileId, 'delete', {
        source: 'sync',
        photoId,
        albumId,
      });
    }
  }

  /**
   * Handle renamed file
   */
  async handleFileRenamed(fileId: string, newName: string, userId: number): Promise<void> {
    const result = await pool.query(
      `UPDATE photos
       SET name = $1
       WHERE provider_file_id = $2
       AND album_id IN (SELECT id FROM albums WHERE user_id = $3)
       RETURNING id, album_id`,
      [newName, fileId, userId]
    );

    if (result.rows.length > 0) {
      const albumId = result.rows[0].album_id;

      // Invalidate caches
      await this.cacheService.invalidateGalleryPhotos(albumId);
    }
  }

  /**
   * Handle moved folder
   */
  async handleFolderMoved(folderId: string, newParentId: string, userId: number): Promise<void> {
    // Update folder mapping
    await pool.query(
      `UPDATE folder_mappings
       SET parent_folder_id = $1
       WHERE provider_folder_id = $2
       AND gallery_id IN (SELECT id FROM albums WHERE user_id = $3)`,
      [newParentId, folderId, userId]
    );
  }

  /**
   * Start background sync job
   */
  startSyncJob(schedule: string = '0 * * * *'): void {
    // Default: Run every hour at minute 0
    cron.schedule(schedule, async () => {
      console.log('Starting scheduled sync job...');
      try {
        await this.syncAll();
      } catch (error) {
        console.error('Sync job failed:', error);
      }
    });

    console.log(`Sync job scheduled with pattern: ${schedule}`);
  }
}
