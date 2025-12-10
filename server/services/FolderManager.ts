// Folder management service
import pool from '../db';
import { IStorageProvider } from '../types/storage';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import { DropboxProvider } from './DropboxProvider';
import { withRetry } from '../utils/retry';

export interface FolderMapping {
  galleryId: number;
  provider: string;
  providerFolderId: string;
  parentFolderId?: string;
}

export class FolderManager {
  /**
   * Initialize root folder for a user's storage provider
   * This is idempotent - will reuse existing folder if found
   */
  async initializeRootFolder(userId: number, provider: string): Promise<string> {
    // Check if root folder already exists in database
    const existingRoot = await pool.query(
      'SELECT provider_folder_id FROM root_folders WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    if (existingRoot.rows.length > 0) {
      return existingRoot.rows[0].provider_folder_id;
    }

    // Get storage provider instance
    const storageProvider = await this.getStorageProvider(userId, provider);

    // Try to create the root folder (or find existing one)
    const rootFolder = await withRetry(async () => {
      return storageProvider.createFolder('RawBox');
    });

    // Store in database
    await pool.query(
      'INSERT INTO root_folders (user_id, provider, provider_folder_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, provider) DO NOTHING',
      [userId, provider, rootFolder.id]
    );

    return rootFolder.id;
  }

  /**
   * Create a folder for a gallery in cloud storage
   */
  async createGalleryFolder(
    userId: number,
    galleryId: number,
    galleryName: string
  ): Promise<string> {
    // Get user's storage provider
    const connection = await pool.query(
      'SELECT provider FROM storage_connections WHERE user_id = $1 AND status = $2 LIMIT 1',
      [userId, 'active']
    );

    if (connection.rows.length === 0) {
      throw new Error('No active storage provider found for user');
    }

    const provider = connection.rows[0].provider;

    // Ensure root folder exists
    const rootFolderId = await this.initializeRootFolder(userId, provider);

    // Get storage provider instance
    const storageProvider = await this.getStorageProvider(userId, provider);

    // Create gallery folder under root
    const galleryFolder = await withRetry(async () => {
      return storageProvider.createFolder(galleryName, rootFolderId);
    });

    // Store mapping in database
    await pool.query(
      `INSERT INTO folder_mappings (gallery_id, provider, provider_folder_id, parent_folder_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (gallery_id, provider) DO UPDATE SET provider_folder_id = EXCLUDED.provider_folder_id`,
      [galleryId, provider, galleryFolder.id, rootFolderId]
    );

    return galleryFolder.id;
  }

  /**
   * Create a sub-gallery folder within a parent gallery folder
   */
  async createSubGalleryFolder(
    userId: number,
    parentGalleryId: number,
    subGalleryId: number,
    name: string
  ): Promise<string> {
    // Get parent gallery folder mapping
    const parentMapping = await this.getFolderMapping(parentGalleryId);

    if (!parentMapping) {
      throw new Error('Parent gallery folder not found');
    }

    // Get storage provider instance
    const storageProvider = await this.getStorageProvider(userId, parentMapping.provider);

    // Create sub-folder
    const subFolder = await withRetry(async () => {
      return storageProvider.createFolder(name, parentMapping.providerFolderId);
    });

    // Store mapping in database
    await pool.query(
      `INSERT INTO folder_mappings (gallery_id, provider, provider_folder_id, parent_folder_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (gallery_id, provider) DO UPDATE SET provider_folder_id = EXCLUDED.provider_folder_id`,
      [subGalleryId, parentMapping.provider, subFolder.id, parentMapping.providerFolderId]
    );

    return subFolder.id;
  }

  /**
   * Get folder mapping for a gallery
   */
  async getFolderMapping(galleryId: number): Promise<FolderMapping | null> {
    const result = await pool.query(
      'SELECT gallery_id, provider, provider_folder_id, parent_folder_id FROM folder_mappings WHERE gallery_id = $1',
      [galleryId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      galleryId: row.gallery_id,
      provider: row.provider,
      providerFolderId: row.provider_folder_id,
      parentFolderId: row.parent_folder_id,
    };
  }

  /**
   * Get storage provider instance for a user
   */
  private async getStorageProvider(userId: number, provider: string): Promise<IStorageProvider> {
    const result = await pool.query(
      'SELECT access_token, refresh_token FROM storage_connections WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    if (result.rows.length === 0) {
      throw new Error('Storage connection not found');
    }

    const { access_token, refresh_token } = result.rows[0];

    if (provider === 'google-drive') {
      return new GoogleDriveProvider(access_token, refresh_token);
    } else if (provider === 'dropbox') {
      return new DropboxProvider(access_token);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
