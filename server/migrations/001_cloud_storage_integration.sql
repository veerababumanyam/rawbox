-- Cloud Storage Integration Migration
-- This migration adds all required tables and extensions for the cloud storage feature

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add folder mappings table
CREATE TABLE IF NOT EXISTS folder_mappings (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_folder_id VARCHAR(255) NOT NULL,
  parent_folder_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gallery_id, provider)
);

CREATE INDEX idx_folder_mappings_gallery ON folder_mappings(gallery_id);
CREATE INDEX idx_folder_mappings_provider ON folder_mappings(provider, provider_folder_id);

-- Add root folder tracking
CREATE TABLE IF NOT EXISTS root_folders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_folder_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_root_folders_user ON root_folders(user_id, provider);

-- Add vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS photo_embeddings (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  embedding vector(768), -- Dimension for Gemini embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(photo_id)
);

-- Add index for vector similarity search using cosine distance
CREATE INDEX IF NOT EXISTS idx_photo_embeddings_vector ON photo_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Add metadata fields to photos table
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_hidden ON photos(is_hidden) WHERE is_hidden = TRUE;
CREATE INDEX IF NOT EXISTS idx_photos_sort ON photos(album_id, sort_order);

-- Add share links table
CREATE TABLE IF NOT EXISTS share_links (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(share_token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_share_links_gallery ON share_links(gallery_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires ON share_links(expires_at) WHERE expires_at IS NOT NULL AND revoked_at IS NULL;

-- Add audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Add sync state tracking
CREATE TABLE IF NOT EXISTS sync_state (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  last_sync_token VARCHAR(255),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_user ON sync_state(user_id, provider);

-- Add connection status and error tracking to storage_connections
ALTER TABLE storage_connections
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_storage_connections_status ON storage_connections(user_id, status);

-- Add MIME type and file size to photos table
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

CREATE INDEX IF NOT EXISTS idx_photos_mime_type ON photos(mime_type);

COMMENT ON TABLE folder_mappings IS 'Maps gallery IDs to cloud storage folder IDs';
COMMENT ON TABLE root_folders IS 'Tracks the root "RawBox" folder for each user in each provider';
COMMENT ON TABLE photo_embeddings IS 'Stores vector embeddings for semantic photo search';
COMMENT ON TABLE share_links IS 'Public share links for galleries with optional password protection';
COMMENT ON TABLE audit_logs IS 'Audit trail for all critical operations';
COMMENT ON TABLE sync_state IS 'Tracks synchronization state with cloud providers';
