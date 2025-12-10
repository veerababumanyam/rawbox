// Audit logging service for tracking critical operations
import pool from '../db';

export interface AuditLogEntry {
  userId?: number;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
}

export class AuditLogger {
  /**
   * Log storage connection events
   */
  async logConnection(
    userId: number,
    provider: string,
    action: 'connected' | 'disconnected',
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `storage_${action}`,
      resourceType: 'storage_connection',
      resourceId: provider,
      metadata: { provider },
      ipAddress,
    });
  }

  /**
   * Log file operations
   */
  async logFileOperation(
    userId: number,
    fileId: string,
    operation: 'upload' | 'delete' | 'view' | 'download',
    metadata: any = {},
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `file_${operation}`,
      resourceType: 'file',
      resourceId: fileId,
      metadata,
      ipAddress,
    });
  }

  /**
   * Log sharing events
   */
  async logShareOperation(
    userId: number,
    galleryId: number,
    action: 'created' | 'revoked' | 'accessed',
    shareToken: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `share_${action}`,
      resourceType: 'share_link',
      resourceId: shareToken,
      metadata: { galleryId },
      ipAddress,
    });
  }

  /**
   * Log errors
   */
  async logError(
    context: string,
    error: Error,
    metadata: any = {},
    userId?: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'error',
      resourceType: 'system',
      resourceId: context,
      metadata: {
        ...metadata,
        errorMessage: error.message,
        errorStack: error.stack,
      },
      ipAddress,
    });
  }

  /**
   * Log sync conflicts
   */
  async logConflict(
    userId: number,
    conflict: {
      type: string;
      details: string;
      galleryId?: number;
      photoId?: number;
    }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'sync_conflict',
      resourceType: 'sync',
      resourceId: conflict.type,
      metadata: conflict,
    });
  }

  /**
   * Log metadata operations
   */
  async logMetadataOperation(
    userId: number,
    photoId: number,
    operation: 'tag_added' | 'tag_removed' | 'visibility_changed' | 'sort_order_changed',
    metadata: any = {},
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `metadata_${operation}`,
      resourceType: 'photo',
      resourceId: photoId.toString(),
      metadata,
      ipAddress,
    });
  }

  /**
   * Log gallery operations
   */
  async logGalleryOperation(
    userId: number,
    galleryId: number,
    operation: 'created' | 'deleted' | 'updated',
    metadata: any = {},
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `gallery_${operation}`,
      resourceType: 'gallery',
      resourceId: galleryId.toString(),
      metadata,
      ipAddress,
    });
  }

  /**
   * Core logging method
   */
  private async log(entry: AuditLogEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.userId || null,
          entry.action,
          entry.resourceType,
          entry.resourceId || null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ipAddress || null,
        ]
      );
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to write audit log:', error);
      console.error('Audit log entry:', entry);
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(
    userId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get audit logs by action
   */
  async getLogsByAction(
    action: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM audit_logs
       WHERE action = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [action, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM audit_logs
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [resourceType, resourceId, limit]
    );

    return result.rows;
  }
}
