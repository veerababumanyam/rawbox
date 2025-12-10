import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import './passport-setup';
import pool from './db';
import { oAuth2Client, uploadFile } from './drive-service'; // Import oAuth2Client and uploadFile from drive-service
import { getDropboxAuthUrl, getDropboxAccessToken } from './dropbox-service'; // Import Dropbox service functions
import multer from 'multer'; // Import multer for file uploads
import { PassThrough, Readable } from 'stream'; // Import PassThrough and Readable from stream
import { connectRedis, redisClient } from './redis-service'; // Import redisClient and connectRedis
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { FolderManager } from './services/FolderManager';
import { TokenManager } from './services/TokenManager';
import { CacheService } from './services/CacheService';
import { AuditLogger } from './services/AuditLogger';
import { GoogleDriveProvider } from './services/GoogleDriveProvider';
import { DropboxProvider } from './services/DropboxProvider';
import { VectorSearchService } from './services/VectorSearchService';
import { RateLimiter } from './services/RateLimiter';

// Extend the Request type to include the 'user' property from Passport
declare global {
  namespace Express {
    interface User {
      id: number;
      // Add other user properties here if needed
    }
  }
}

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if the user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

// Health check endpoint for Docker healthcheck and monitoring
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    // Check Redis connection
    if (!redisClient.isOpen) {
      throw new Error('Redis not connected');
    }
    await redisClient.ping();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/current_user', (req, res) => {
  res.send(req.user);
});

app.get('/api/logout', (req, res, next: NextFunction) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Google Drive OAuth routes
app.get('/auth/google-drive', requireAuth, (req, res) => {
  const googleDriveAuthUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state: req.user ? req.user.id.toString() : '', // Pass user ID as state
  });
  res.redirect(googleDriveAuthUrl);
});

app.get('/auth/google-drive/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);

    const userId = parseInt(state as string);

    // Save tokens to the database for the user (state is user ID)
    await pool.query(
      'INSERT INTO storage_connections (user_id, provider, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, provider) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_at = EXCLUDED.expires_at',
      [
        userId,
        'google-drive',
        tokens.access_token,
        tokens.refresh_token,
        new Date(tokens.expiry_date!),
      ]
    );

    // Invalidate storage providers cache
    const cacheService = new CacheService();
    await cacheService.invalidateStorageProviders(userId);

    // Log the connection
    await auditLogger.logConnection(
      userId,
      'google-drive',
      'connect',
      { success: true },
      req.ip
    );

    res.send('Google Drive connected successfully!');
  } catch (error) {
    console.error('Error connecting Google Drive:', error);
    res.status(500).send('Error connecting Google Drive.');
  }
});

// Dropbox OAuth routes
app.get('/auth/dropbox', requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).send('Unauthorized');
  }
  const dropboxAuthUrl = getDropboxAuthUrl(req.user.id.toString());
  res.redirect(dropboxAuthUrl);
});

app.get('/auth/dropbox/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const accessTokenResult = await getDropboxAccessToken(code as string);
    const { access_token, refresh_token, expires_in } = accessTokenResult as any;

    const userId = parseInt(state as string);

    // Save tokens to the database for the user (state is user ID)
    await pool.query(
      'INSERT INTO storage_connections (user_id, provider, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, provider) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_at = EXCLUDED.expires_at',
      [
        userId,
        'dropbox',
        access_token,
        refresh_token,
        new Date(Date.now() + expires_in * 1000), // expires_in is in seconds
      ]
    );

    // Invalidate storage providers cache
    const cacheService = new CacheService();
    await cacheService.invalidateStorageProviders(userId);

    // Log the connection
    await auditLogger.logConnection(
      userId,
      'dropbox',
      'connect',
      { success: true },
      req.ip
    );

    res.send('Dropbox connected successfully!');
  } catch (error) {
    console.error('Error connecting Dropbox:', error);
    res.status(500).send('Error connecting Dropbox.');
  }
});

// Initialize services
const folderManager = new FolderManager();
const tokenManager = new TokenManager();
const cacheService = new CacheService();
const auditLogger = new AuditLogger();
const rateLimiter = new RateLimiter();
let vectorSearchService: VectorSearchService | null = null;

// Initialize VectorSearchService only if GEMINI_API_KEY is available
try {
  vectorSearchService = new VectorSearchService();
  console.log('VectorSearchService initialized successfully');
} catch (error) {
  console.warn('VectorSearchService not available:', (error as Error).message);
  console.warn('Semantic search features will be disabled');
}

// File upload endpoint
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = req.user!.id;
  const { provider, albumId } = req.body;
  const ipAddress = req.ip;

  try {
    // Validate input
    if (!provider || !albumId) {
      return res.status(400).json({ error: 'Missing required fields: provider or albumId' });
    }

    // Check if storage provider is connected
    const connection = await pool.query(
      'SELECT * FROM storage_connections WHERE user_id = $1 AND provider = $2 AND status = $3',
      [userId, provider, 'active']
    );

    if (connection.rows.length === 0) {
      return res.status(400).json({ error: 'Storage provider not connected or inactive' });
    }

    // Get valid access token (will auto-refresh if needed)
    const accessToken = await tokenManager.getValidToken(userId, provider);
    const { refresh_token } = connection.rows[0];

    // Get or create folder mapping for the album
    let folderMapping = await folderManager.getFolderMapping(parseInt(albumId));

    if (!folderMapping) {
      // Get album name
      const albumResult = await pool.query('SELECT name FROM albums WHERE id = $1', [albumId]);
      if (albumResult.rows.length === 0) {
        return res.status(404).json({ error: 'Album not found' });
      }

      const albumName = albumResult.rows[0].name;
      const folderId = await folderManager.createGalleryFolder(userId, parseInt(albumId), albumName);
      folderMapping = { galleryId: parseInt(albumId), provider, providerFolderId: folderId };
    }

    // Check rate limits before proceeding
    const canProceed = await rateLimiter.canMakeRequest(provider, 'upload');
    if (!canProceed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many upload requests. Please try again later.'
      });
    }

    // Check if provider is in backoff state
    const inBackoff = await rateLimiter.isInBackoff(provider);
    if (inBackoff) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'The storage provider is temporarily rate-limited. Please try again later.'
      });
    }

    // Determine upload method based on file size
    const fileSize = req.file.size;
    const useResumableUpload = fileSize > 10 * 1024 * 1024; // 10MB threshold

    let uploadedFile;
    let storageProvider;

    if (provider === 'google-drive') {
      storageProvider = new GoogleDriveProvider(accessToken, refresh_token);

      if (useResumableUpload) {
        const fileStream = Readable.from(req.file.buffer);
        uploadedFile = await storageProvider.uploadFileResumable(
          fileStream,
          req.file.originalname,
          req.file.mimetype,
          fileSize,
          folderMapping.providerFolderId
        );
      } else {
        uploadedFile = await storageProvider.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          folderMapping.providerFolderId
        );
      }
    } else if (provider === 'dropbox') {
      storageProvider = new DropboxProvider(accessToken);

      if (useResumableUpload) {
        const fileStream = Readable.from(req.file.buffer);
        uploadedFile = await storageProvider.uploadFileResumable(
          fileStream,
          req.file.originalname,
          req.file.mimetype,
          fileSize,
          folderMapping.providerFolderId
        );
      } else {
        uploadedFile = await storageProvider.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          folderMapping.providerFolderId
        );
      }
    } else {
      return res.status(400).json({ error: 'Invalid storage provider' });
    }

    // Save file metadata to PostgreSQL
    const photoResult = await pool.query(
      `INSERT INTO photos (album_id, provider, provider_file_id, name, url, mime_type, file_size, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        albumId,
        provider,
        uploadedFile.id,
        uploadedFile.name,
        uploadedFile.url,
        uploadedFile.mimeType,
        uploadedFile.size,
        null, // TODO: Extract actual dimensions from image metadata
        null,
      ]
    );

    const photoId = photoResult.rows[0].id;

    // Record the request for rate limiting
    await rateLimiter.recordRequest(provider, 'upload');

    // Cache the file URL
    await cacheService.cacheFileUrl(uploadedFile.id, uploadedFile.url, 3600);

    // Invalidate gallery photos cache
    await cacheService.invalidateGalleryPhotos(parseInt(albumId));

    // Log the file upload operation
    await auditLogger.logFileOperation(
      userId,
      uploadedFile.id,
      'upload',
      {
        albumId,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
        provider,
        resumable: useResumableUpload,
      },
      ipAddress
    );

    // Generate vector embedding for semantic search (non-blocking)
    // This runs asynchronously and failures won't break the upload
    if (vectorSearchService) {
      vectorSearchService.generatePhotoEmbedding(photoId, uploadedFile.name)
        .catch(error => {
          console.error(`Failed to generate embedding for photo ${photoId}:`, error);
        });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      photo: {
        id: photoId,
        name: uploadedFile.name,
        url: uploadedFile.url,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);

    // Log the error
    await auditLogger.logError(
      'file_upload',
      error as Error,
      { albumId, provider, fileName: req.file.originalname },
      userId,
      ipAddress
    );

    res.status(500).json({ error: 'Error uploading file', details: (error as Error).message });
  }
});

app.get('/api/storage-providers', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const cacheService = new CacheService();

    // Try to get from cache first
    const cachedProviders = await cacheService.getStorageProviders(userId);

    if (cachedProviders) {
      return res.status(200).json(cachedProviders);
    }

    const result = await pool.query(
      'SELECT provider FROM storage_connections WHERE user_id = $1',
      [userId]
    );
    const providers = result.rows.map(row => {
      let name = '';
      if (row.provider === 'google-drive') {
        name = 'Google Drive';
      } else if (row.provider === 'dropbox') {
        name = 'Dropbox';
      }
      return { id: row.provider, name };
    });

    // Cache the result for 1 hour (3600 seconds)
    await cacheService.cacheStorageProviders(userId, providers, 3600);

    res.status(200).json(providers);
  } catch (error) {
    console.error('Error fetching storage providers:', error);
    res.status(500).send('Error fetching storage providers.');
  }
});

// Rate limit monitoring endpoint
app.get('/api/rate-limits', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get all connected storage providers
    const result = await pool.query(
      'SELECT provider FROM storage_connections WHERE user_id = $1',
      [userId]
    );

    const providers = result.rows.map(row => row.provider);

    // Get usage stats for each provider
    const usageStats = await Promise.all(
      providers.map(async (provider) => {
        const usage = await rateLimiter.getUsage(provider, 'upload');
        const inBackoff = await rateLimiter.isInBackoff(provider);

        return {
          provider,
          usage: {
            requestsThisHour: usage.requestsThisHour,
            quotaLimit: usage.quotaLimit,
            percentUsed: Math.round(usage.percentUsed * 100) / 100,
            status: inBackoff ? 'backoff' : usage.percentUsed > 80 ? 'warning' : 'normal'
          }
        };
      })
    );

    // Log warning if any provider is approaching limits
    usageStats.forEach(({ provider, usage }) => {
      if (usage.percentUsed > 80 && usage.status !== 'backoff') {
        console.warn(`Rate limit warning for ${provider}: ${usage.percentUsed}% of quota used`);
      }
    });

    res.status(200).json({ providers: usageStats });
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    res.status(500).json({ error: 'Failed to fetch rate limits' });
  }
});

// Semantic search API endpoints
app.get('/api/search/text', requireAuth, async (req, res) => {
  try {
    if (!vectorSearchService) {
      return res.status(503).json({
        error: 'Semantic search is not available',
        message: 'Vector search service is not configured. Please configure GEMINI_API_KEY.'
      });
    }

    const userId = req.user!.id;
    const { q, limit, threshold } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const searchLimit = limit ? parseInt(limit as string) : 20;
    const searchThreshold = threshold ? parseFloat(threshold as string) : 0.7;

    const results = await vectorSearchService.searchByText(
      q,
      userId,
      searchLimit,
      searchThreshold
    );

    res.status(200).json({
      query: q,
      results: results.map(r => ({
        photoId: r.photoId,
        similarity: r.similarity,
        url: r.url,
        name: r.name,
        albumId: r.albumId
      })),
      count: results.length
    });
  } catch (error) {
    console.error('Error in text search:', error);
    res.status(500).json({
      error: 'Search failed',
      message: (error as Error).message
    });
  }
});

app.get('/api/search/similar/:photoId', requireAuth, async (req, res) => {
  try {
    if (!vectorSearchService) {
      return res.status(503).json({
        error: 'Semantic search is not available',
        message: 'Vector search service is not configured. Please configure GEMINI_API_KEY.'
      });
    }

    const userId = req.user!.id;
    const photoId = parseInt(req.params.photoId);
    const { limit, threshold } = req.query;

    if (isNaN(photoId)) {
      return res.status(400).json({ error: 'Invalid photo ID' });
    }

    const searchLimit = limit ? parseInt(limit as string) : 20;
    const searchThreshold = threshold ? parseFloat(threshold as string) : 0.7;

    const results = await vectorSearchService.searchBySimilarImage(
      photoId,
      userId,
      searchLimit,
      searchThreshold
    );

    res.status(200).json({
      referencePhotoId: photoId,
      results: results.map(r => ({
        photoId: r.photoId,
        similarity: r.similarity,
        url: r.url,
        name: r.name,
        albumId: r.albumId
      })),
      count: results.length
    });
  } catch (error) {
    console.error('Error in similar image search:', error);
    res.status(500).json({
      error: 'Search failed',
      message: (error as Error).message
    });
  }
});

// Metadata management API endpoints
app.patch('/api/photos/:photoId/tags', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const photoId = parseInt(req.params.photoId);
    const { tags } = req.body;

    if (isNaN(photoId)) {
      return res.status(400).json({ error: 'Invalid photo ID' });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    // Verify photo ownership
    const ownershipCheck = await pool.query(
      `SELECT p.id FROM photos p
       JOIN albums a ON p.album_id = a.id
       WHERE p.id = $1 AND a.user_id = $2`,
      [photoId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found or access denied' });
    }

    // Update tags
    await pool.query(
      'UPDATE photos SET tags = $1 WHERE id = $2',
      [tags, photoId]
    );

    // Invalidate cache for the photo's album
    const albumResult = await pool.query(
      'SELECT album_id FROM photos WHERE id = $1',
      [photoId]
    );
    if (albumResult.rows.length > 0) {
      await cacheService.invalidateGalleryPhotos(albumResult.rows[0].album_id);
    }

    res.status(200).json({ success: true, photoId, tags });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

app.patch('/api/photos/:photoId/sort-order', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const photoId = parseInt(req.params.photoId);
    const { sortOrder } = req.body;

    if (isNaN(photoId)) {
      return res.status(400).json({ error: 'Invalid photo ID' });
    }

    if (typeof sortOrder !== 'number') {
      return res.status(400).json({ error: 'Sort order must be a number' });
    }

    // Verify photo ownership
    const ownershipCheck = await pool.query(
      `SELECT p.id FROM photos p
       JOIN albums a ON p.album_id = a.id
       WHERE p.id = $1 AND a.user_id = $2`,
      [photoId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found or access denied' });
    }

    // Update sort order
    await pool.query(
      'UPDATE photos SET sort_order = $1 WHERE id = $2',
      [sortOrder, photoId]
    );

    // Invalidate cache
    const albumResult = await pool.query(
      'SELECT album_id FROM photos WHERE id = $1',
      [photoId]
    );
    if (albumResult.rows.length > 0) {
      await cacheService.invalidateGalleryPhotos(albumResult.rows[0].album_id);
    }

    res.status(200).json({ success: true, photoId, sortOrder });
  } catch (error) {
    console.error('Error updating sort order:', error);
    res.status(500).json({ error: 'Failed to update sort order' });
  }
});

app.patch('/api/photos/:photoId/visibility', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const photoId = parseInt(req.params.photoId);
    const { isHidden } = req.body;

    if (isNaN(photoId)) {
      return res.status(400).json({ error: 'Invalid photo ID' });
    }

    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({ error: 'isHidden must be a boolean' });
    }

    // Verify photo ownership
    const ownershipCheck = await pool.query(
      `SELECT p.id FROM photos p
       JOIN albums a ON p.album_id = a.id
       WHERE p.id = $1 AND a.user_id = $2`,
      [photoId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found or access denied' });
    }

    // Update visibility
    await pool.query(
      'UPDATE photos SET is_hidden = $1 WHERE id = $2',
      [isHidden, photoId]
    );

    // Invalidate cache
    const albumResult = await pool.query(
      'SELECT album_id FROM photos WHERE id = $1',
      [photoId]
    );
    if (albumResult.rows.length > 0) {
      await cacheService.invalidateGalleryPhotos(albumResult.rows[0].album_id);
    }

    res.status(200).json({ success: true, photoId, isHidden });
  } catch (error) {
    console.error('Error updating visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

app.delete('/api/photos/:photoId', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const photoId = parseInt(req.params.photoId);

    if (isNaN(photoId)) {
      return res.status(400).json({ error: 'Invalid photo ID' });
    }

    // Verify photo ownership
    const ownershipCheck = await pool.query(
      `SELECT p.id, p.album_id FROM photos p
       JOIN albums a ON p.album_id = a.id
       WHERE p.id = $1 AND a.user_id = $2`,
      [photoId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found or access denied' });
    }

    const albumId = ownershipCheck.rows[0].album_id;

    // Soft delete - set deleted_at timestamp
    await pool.query(
      'UPDATE photos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [photoId]
    );

    // Invalidate cache
    await cacheService.invalidateGalleryPhotos(albumId);

    // Delete vector embedding if exists
    if (vectorSearchService) {
      try {
        await vectorSearchService.deleteEmbedding(photoId);
      } catch (error) {
        console.error('Error deleting embedding:', error);
      }
    }

    res.status(200).json({ success: true, photoId });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Albums API endpoints
app.get('/api/albums', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT a.id, a.name as title, a.description, a.created_at as date,
              COUNT(p.id) as photo_count,
              (SELECT url FROM photos WHERE album_id = a.id LIMIT 1) as cover_url
       FROM albums a
       LEFT JOIN photos p ON a.id = p.album_id
       WHERE a.user_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );

    const albums = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      clientName: '', // TODO: Add client relationship
      date: new Date(row.date).toISOString().split('T')[0],
      coverUrl: row.cover_url || 'https://picsum.photos/800/600',
      photoCount: parseInt(row.photo_count) || 0,
      status: 'published',
      photos: [],
      subGalleries: [],
      settings: {
        isShared: true,
        isPasswordProtected: false,
        emailRegistration: false,
        allowDownload: true,
        showMetadata: true,
        theme: 'light',
        focalPointX: 50,
        focalPointY: 50
      }
    }));

    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Error fetching albums' });
  }
});

app.get('/api/albums/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const albumId = req.params.id;
    const cacheService = new CacheService();

    // Try to get photos from cache first
    const cachedPhotos = await cacheService.getGalleryPhotos(parseInt(albumId));

    const albumResult = await pool.query(
      'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
      [albumId, userId]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = albumResult.rows[0];

    let photos;

    if (cachedPhotos) {
      // Use cached photos (filter out deleted and hidden photos)
      photos = cachedPhotos
        .filter(photo => !photo.deleted_at && !photo.is_hidden)
        .sort((a, b) => {
          // Sort by sort_order first, then by created_at desc
          if (a.sort_order !== b.sort_order) {
            return (a.sort_order || 0) - (b.sort_order || 0);
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .map(photo => ({
          id: photo.id.toString(),
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl || photo.url,
          title: photo.name,
          description: photo.description || '',
          width: photo.width || 800,
          height: photo.height || 600,
          type: 'photo',
          status: 'active',
          tags: photo.tags || []
        }));
    } else {
      // Fetch from database and cache the result
      // Filter out hidden and deleted photos, sort by sort_order and created_at
      const photosResult = await pool.query(
        `SELECT * FROM photos
         WHERE album_id = $1
           AND deleted_at IS NULL
           AND is_hidden = FALSE
         ORDER BY sort_order ASC, created_at DESC`,
        [albumId]
      );

      photos = photosResult.rows.map(photo => ({
        id: photo.id.toString(),
        url: photo.url,
        thumbnailUrl: photo.url,
        title: photo.name,
        description: photo.description,
        width: photo.width || 800,
        height: photo.height || 600,
        type: 'photo',
        status: 'active',
        tags: photo.tags || []
      }));

      // Cache the photos (store raw database results for caching)
      await cacheService.cacheGalleryPhotos(parseInt(albumId), photosResult.rows);
    }

    res.json({
      id: album.id.toString(),
      title: album.name,
      clientName: '',
      date: new Date(album.created_at).toISOString().split('T')[0],
      coverUrl: photos[0]?.url || 'https://picsum.photos/800/600',
      photoCount: photos.length,
      status: 'published',
      photos,
      subGalleries: [],
      settings: {
        isShared: true,
        isPasswordProtected: false,
        emailRegistration: false,
        allowDownload: true,
        showMetadata: true,
        theme: 'light',
        focalPointX: 50,
        focalPointY: 50
      }
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Error fetching album' });
  }
});

app.post('/api/albums', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { title, description } = req.body;

    const result = await pool.query(
      'INSERT INTO albums (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, description || '']
    );

    const album = result.rows[0];

    res.status(201).json({
      id: album.id.toString(),
      title: album.name,
      clientName: '',
      date: new Date(album.created_at).toISOString().split('T')[0],
      coverUrl: 'https://picsum.photos/800/600',
      photoCount: 0,
      status: 'draft',
      photos: [],
      subGalleries: [],
      settings: {
        isShared: false,
        isPasswordProtected: false,
        emailRegistration: false,
        allowDownload: true,
        showMetadata: true,
        theme: 'light',
        focalPointX: 50,
        focalPointY: 50
      }
    });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Error creating album' });
  }
});

// Share link API endpoints
app.post('/api/share-links', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { galleryId, password, expiresInDays } = req.body;

    if (!galleryId) {
      return res.status(400).json({ error: 'Gallery ID is required' });
    }

    // Verify user owns the gallery
    const galleryCheck = await pool.query(
      'SELECT id FROM albums WHERE id = $1 AND user_id = $2',
      [galleryId, userId]
    );

    if (galleryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Gallery not found or access denied' });
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Insert share link
    const result = await pool.query(
      `INSERT INTO share_links (gallery_id, share_token, password_hash, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, share_token, expires_at, created_at`,
      [galleryId, shareToken, passwordHash, expiresAt, userId]
    );

    const shareLink = result.rows[0];

    // Log the share operation
    await auditLogger.logShareOperation(
      userId,
      galleryId,
      'create',
      {
        shareToken,
        hasPassword: !!password,
        expiresAt: expiresAt?.toISOString() || null
      },
      req.ip
    );

    res.status(201).json({
      id: shareLink.id,
      shareToken: shareLink.share_token,
      shareUrl: `${req.protocol}://${req.get('host')}/shared/${shareLink.share_token}`,
      expiresAt: shareLink.expires_at,
      createdAt: shareLink.created_at,
      hasPassword: !!password
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

app.get('/api/shared/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { password } = req.query;

    // Get share link
    const shareLinkResult = await pool.query(
      `SELECT sl.*, a.id as album_id, a.name as album_name
       FROM share_links sl
       JOIN albums a ON sl.gallery_id = a.id
       WHERE sl.share_token = $1
         AND sl.revoked_at IS NULL
         AND (sl.expires_at IS NULL OR sl.expires_at > CURRENT_TIMESTAMP)`,
      [shareToken]
    );

    if (shareLinkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Share link not found, expired, or revoked' });
    }

    const shareLink = shareLinkResult.rows[0];

    // Check password if required
    if (shareLink.password_hash) {
      if (!password) {
        return res.status(401).json({
          error: 'Password required',
          requiresPassword: true
        });
      }

      const passwordMatch = await bcrypt.compare(password as string, shareLink.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          error: 'Incorrect password',
          requiresPassword: true
        });
      }
    }

    // Get album photos (only visible, non-deleted)
    const photosResult = await pool.query(
      `SELECT * FROM photos
       WHERE album_id = $1
         AND deleted_at IS NULL
         AND is_hidden = FALSE
       ORDER BY sort_order ASC, created_at DESC`,
      [shareLink.album_id]
    );

    const photos = photosResult.rows.map(photo => ({
      id: photo.id.toString(),
      url: photo.url,
      thumbnailUrl: photo.url,
      title: photo.name,
      description: photo.description,
      width: photo.width || 800,
      height: photo.height || 600,
      type: 'photo',
      tags: photo.tags || []
    }));

    res.status(200).json({
      album: {
        id: shareLink.album_id.toString(),
        title: shareLink.album_name,
        photoCount: photos.length,
        photos
      },
      shareInfo: {
        expiresAt: shareLink.expires_at,
        hasPassword: !!shareLink.password_hash
      }
    });
  } catch (error) {
    console.error('Error accessing shared gallery:', error);
    res.status(500).json({ error: 'Failed to access shared gallery' });
  }
});

app.delete('/api/share-links/:shareToken', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { shareToken } = req.params;

    // Verify ownership
    const shareLinkResult = await pool.query(
      `SELECT sl.id, sl.gallery_id
       FROM share_links sl
       JOIN albums a ON sl.gallery_id = a.id
       WHERE sl.share_token = $1 AND a.user_id = $2`,
      [shareToken, userId]
    );

    if (shareLinkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Share link not found or access denied' });
    }

    const shareLink = shareLinkResult.rows[0];

    // Revoke the share link
    await pool.query(
      'UPDATE share_links SET revoked_at = CURRENT_TIMESTAMP WHERE share_token = $1',
      [shareToken]
    );

    // Log the revocation
    await auditLogger.logShareOperation(
      userId,
      shareLink.gallery_id,
      'revoke',
      { shareToken },
      req.ip
    );

    res.status(200).json({ success: true, message: 'Share link revoked' });
  } catch (error) {
    console.error('Error revoking share link:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

// Connect to Redis and start the server
connectRedis().then(() => {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
});
