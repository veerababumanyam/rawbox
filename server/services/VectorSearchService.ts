// Vector search service using pgvector and Gemini AI for semantic photo search
import pool from '../db';
import { GoogleGenerativeAI } from '@google/genai';

export interface SearchResult {
  photoId: number;
  similarity: number;
  url: string;
  name: string;
  albumId: number;
}

export class VectorSearchService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for vector search');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use text embedding model for generating embeddings
    this.model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
  }

  /**
   * Generate an embedding vector for text using Gemini AI
   * @param text The text to generate an embedding for (e.g., photo description, search query)
   * @returns A 768-dimensional embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text);
      const embedding = result.embedding;

      if (!embedding || !embedding.values || embedding.values.length !== 768) {
        throw new Error(`Invalid embedding dimension: expected 768, got ${embedding?.values?.length || 0}`);
      }

      return embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
    }
  }

  /**
   * Store an embedding for a photo in the database
   * @param photoId The photo ID
   * @param embedding The 768-dimensional embedding vector
   */
  async storeEmbedding(photoId: number, embedding: number[]): Promise<void> {
    try {
      if (embedding.length !== 768) {
        throw new Error(`Invalid embedding dimension: expected 768, got ${embedding.length}`);
      }

      // Convert array to pgvector format: '[1,2,3,...]'
      const vectorStr = `[${embedding.join(',').slice(0, 100000)}]`; // Limit string length

      await pool.query(
        `INSERT INTO photo_embeddings (photo_id, embedding)
         VALUES ($1, $2)
         ON CONFLICT (photo_id)
         DO UPDATE SET embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP`,
        [photoId, vectorStr]
      );
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw new Error(`Failed to store embedding: ${(error as Error).message}`);
    }
  }

  /**
   * Search for photos by text query using semantic similarity
   * @param query The search query text
   * @param userId The user ID to filter results
   * @param limit Maximum number of results to return
   * @param threshold Minimum similarity threshold (0-1, default 0.7)
   * @returns Array of search results ordered by similarity
   */
  async searchByText(
    query: string,
    userId: number,
    limit: number = 20,
    threshold: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query);
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      // Search using cosine similarity (1 - cosine_distance)
      // Higher similarity means more similar (closer to 1)
      const result = await pool.query(
        `SELECT
           p.id as photo_id,
           1 - (pe.embedding <=> $1::vector) as similarity,
           p.url,
           p.name,
           p.album_id
         FROM photo_embeddings pe
         JOIN photos p ON pe.photo_id = p.id
         JOIN albums a ON p.album_id = a.id
         WHERE a.user_id = $2
           AND p.deleted_at IS NULL
           AND p.is_hidden = FALSE
           AND (1 - (pe.embedding <=> $1::vector)) >= $3
         ORDER BY pe.embedding <=> $1::vector ASC
         LIMIT $4`,
        [vectorStr, userId, threshold, limit]
      );

      return result.rows.map(row => ({
        photoId: row.photo_id,
        similarity: parseFloat(row.similarity),
        url: row.url,
        name: row.name,
        albumId: row.album_id,
      }));
    } catch (error) {
      console.error('Error searching by text:', error);
      throw new Error(`Failed to search by text: ${(error as Error).message}`);
    }
  }

  /**
   * Find similar images to a given photo
   * @param photoId The reference photo ID
   * @param userId The user ID to filter results
   * @param limit Maximum number of results to return
   * @param threshold Minimum similarity threshold (0-1, default 0.7)
   * @returns Array of similar photos ordered by similarity
   */
  async searchBySimilarImage(
    photoId: number,
    userId: number,
    limit: number = 20,
    threshold: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      // Get the embedding of the reference photo
      const embeddingResult = await pool.query(
        'SELECT embedding FROM photo_embeddings WHERE photo_id = $1',
        [photoId]
      );

      if (embeddingResult.rows.length === 0) {
        throw new Error(`No embedding found for photo ID ${photoId}`);
      }

      const referenceEmbedding = embeddingResult.rows[0].embedding;

      // Search for similar photos
      const result = await pool.query(
        `SELECT
           p.id as photo_id,
           1 - (pe.embedding <=> $1) as similarity,
           p.url,
           p.name,
           p.album_id
         FROM photo_embeddings pe
         JOIN photos p ON pe.photo_id = p.id
         JOIN albums a ON p.album_id = a.id
         WHERE a.user_id = $2
           AND p.id != $3
           AND p.deleted_at IS NULL
           AND p.is_hidden = FALSE
           AND (1 - (pe.embedding <=> $1)) >= $4
         ORDER BY pe.embedding <=> $1 ASC
         LIMIT $5`,
        [referenceEmbedding, userId, photoId, threshold, limit]
      );

      return result.rows.map(row => ({
        photoId: row.photo_id,
        similarity: parseFloat(row.similarity),
        url: row.url,
        name: row.name,
        albumId: row.album_id,
      }));
    } catch (error) {
      console.error('Error searching by similar image:', error);
      throw new Error(`Failed to search by similar image: ${(error as Error).message}`);
    }
  }

  /**
   * Generate and store embedding for a photo based on its metadata
   * This should be called after a photo is uploaded
   * @param photoId The photo ID
   * @param photoName The photo filename
   * @param photoDescription Optional photo description
   */
  async generatePhotoEmbedding(
    photoId: number,
    photoName: string,
    photoDescription?: string
  ): Promise<void> {
    try {
      // Create a text representation of the photo for embedding
      // Combine filename (without extension) and description
      const nameWithoutExt = photoName.replace(/\.[^/.]+$/, '');
      const text = photoDescription
        ? `${nameWithoutExt} ${photoDescription}`
        : nameWithoutExt;

      // Generate embedding
      const embedding = await this.generateEmbedding(text);

      // Store in database
      await this.storeEmbedding(photoId, embedding);
    } catch (error) {
      // Log error but don't throw - embedding generation failures shouldn't break uploads
      console.error(`Failed to generate embedding for photo ${photoId}:`, error);
    }
  }

  /**
   * Delete an embedding for a photo
   * @param photoId The photo ID
   */
  async deleteEmbedding(photoId: number): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM photo_embeddings WHERE photo_id = $1',
        [photoId]
      );
    } catch (error) {
      console.error('Error deleting embedding:', error);
      throw new Error(`Failed to delete embedding: ${(error as Error).message}`);
    }
  }
}
