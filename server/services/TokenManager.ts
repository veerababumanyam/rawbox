// Token management service with automatic refresh
import pool from '../db';
import { GoogleDriveProvider } from './GoogleDriveProvider';
import { DropboxProvider } from './DropboxProvider';
import { encryptToken, decryptToken } from '../utils/encryption';

export class TokenManager {
  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(userId: number, provider: string): Promise<string> {
    const result = await pool.query(
      'SELECT access_token, refresh_token, expires_at FROM storage_connections WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    if (result.rows.length === 0) {
      throw new Error('Storage connection not found');
    }

    const { access_token, refresh_token, expires_at } = result.rows[0];

    // Check if token needs refresh (expires within 5 minutes)
    if (this.isTokenExpired(expires_at, 5 * 60 * 1000)) {
      if (!refresh_token) {
        await this.invalidateConnection(userId, provider);
        throw new Error('Token expired and no refresh token available');
      }

      try {
        await this.refreshToken(userId, provider);
        // Recursively get the new token
        return this.getValidToken(userId, provider);
      } catch (error) {
        await this.invalidateConnection(userId, provider);
        throw new Error('Failed to refresh token');
      }
    }

    return access_token;
  }

  /**
   * Refresh an expired access token
   */
  async refreshToken(userId: number, provider: string): Promise<void> {
    const result = await pool.query(
      'SELECT refresh_token FROM storage_connections WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    if (result.rows.length === 0) {
      throw new Error('Storage connection not found');
    }

    const { refresh_token } = result.rows[0];

    if (!refresh_token) {
      throw new Error('No refresh token available');
    }

    let tokenResponse;

    if (provider === 'google-drive') {
      const googleProvider = new GoogleDriveProvider('', refresh_token);
      tokenResponse = await googleProvider.refreshAccessToken(refresh_token);
    } else if (provider === 'dropbox') {
      const dropboxProvider = new DropboxProvider('');
      tokenResponse = await dropboxProvider.refreshAccessToken(refresh_token);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Update tokens in database
    await pool.query(
      `UPDATE storage_connections
       SET access_token = $1,
           refresh_token = COALESCE($2, refresh_token),
           expires_at = $3,
           status = 'active',
           last_error = NULL,
           last_error_at = NULL
       WHERE user_id = $4 AND provider = $5`,
      [
        tokenResponse.accessToken,
        tokenResponse.refreshToken,
        tokenResponse.expiresAt,
        userId,
        provider,
      ]
    );
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(expiresAt: Date, bufferMs: number = 0): boolean {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return expiry.getTime() - now.getTime() <= bufferMs;
  }

  /**
   * Mark a connection as invalid
   */
  async invalidateConnection(userId: number, provider: string): Promise<void> {
    await pool.query(
      `UPDATE storage_connections
       SET status = 'disconnected',
           last_error = 'Token refresh failed',
           last_error_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );
  }

  /**
   * Store encrypted tokens
   */
  async storeEncryptedTokens(
    userId: number,
    provider: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date
  ): Promise<void> {
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

    await pool.query(
      `INSERT INTO storage_connections (user_id, provider, access_token, refresh_token, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (user_id, provider)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, storage_connections.refresh_token),
         expires_at = EXCLUDED.expires_at,
         status = 'active'`,
      [userId, provider, encryptedAccessToken, encryptedRefreshToken, expiresAt]
    );
  }

  /**
   * Get decrypted tokens
   */
  async getDecryptedTokens(
    userId: number,
    provider: string
  ): Promise<{ accessToken: string; refreshToken: string | null }> {
    const result = await pool.query(
      'SELECT access_token, refresh_token FROM storage_connections WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    if (result.rows.length === 0) {
      throw new Error('Storage connection not found');
    }

    const { access_token, refresh_token } = result.rows[0];

    return {
      accessToken: decryptToken(access_token),
      refreshToken: refresh_token ? decryptToken(refresh_token) : null,
    };
  }
}
