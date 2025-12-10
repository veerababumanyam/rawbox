// Redis cache service for photo URLs and metadata
import { redisClient } from '../redis-service';

export interface Photo {
  id: number;
  name: string;
  url: string;
  thumbnailUrl?: string;
  [key: string]: any;
}

export interface Provider {
  id: string;
  name: string;
}

export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour

  /**
   * Cache a file URL
   */
  async cacheFileUrl(fileId: string, url: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const key = `file:url:${fileId}`;
    await redisClient.setEx(key, ttl, url);
  }

  /**
   * Get cached file URL
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    const key = `file:url:${fileId}`;
    return await redisClient.get(key);
  }

  /**
   * Invalidate cached file URL
   */
  async invalidateFileUrl(fileId: string): Promise<void> {
    const key = `file:url:${fileId}`;
    await redisClient.del(key);
  }

  /**
   * Cache gallery photos list
   */
  async cacheGalleryPhotos(
    galleryId: number,
    photos: Photo[],
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = `gallery:photos:${galleryId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(photos));
  }

  /**
   * Get cached gallery photos
   */
  async getGalleryPhotos(galleryId: number): Promise<Photo[] | null> {
    const key = `gallery:photos:${galleryId}`;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate gallery photos cache
   */
  async invalidateGalleryPhotos(galleryId: number): Promise<void> {
    const key = `gallery:photos:${galleryId}`;
    await redisClient.del(key);
  }

  /**
   * Cache storage providers for a user
   */
  async cacheStorageProviders(
    userId: number,
    providers: Provider[],
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = `user:providers:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(providers));
  }

  /**
   * Get cached storage providers
   */
  async getStorageProviders(userId: number): Promise<Provider[] | null> {
    const key = `user:providers:${userId}`;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate storage providers cache
   */
  async invalidateStorageProviders(userId: number): Promise<void> {
    const key = `user:providers:${userId}`;
    await redisClient.del(key);
  }

  /**
   * Cache metadata
   */
  async cacheMetadata(key: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  }

  /**
   * Get cached metadata
   */
  async getMetadata(key: string): Promise<any | null> {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    const info = await redisClient.info('memory');
    const dbSize = await redisClient.dbSize();

    return {
      keys: dbSize,
      memory: this.parseMemoryInfo(info),
    };
  }

  private parseMemoryInfo(info: string): string {
    const match = info.match(/used_memory_human:([^\r\n]+)/);
    return match ? match[1] : 'unknown';
  }
}
