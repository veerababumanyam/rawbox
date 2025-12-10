// Storage provider types and interfaces

export interface IStorageProvider {
  // Folder operations
  createFolder(name: string, parentId?: string): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder>;
  listFolders(parentId: string): Promise<Folder[]>;

  // File operations
  uploadFile(file: Buffer, name: string, mimeType: string, folderId: string): Promise<File>;
  uploadFileResumable(fileStream: NodeJS.ReadableStream, name: string, mimeType: string, size: number, folderId: string): Promise<File>;
  getFile(fileId: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;
  getFileUrl(fileId: string): Promise<string>;

  // Token management
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;

  // Change detection
  getChanges(pageToken?: string): Promise<ChangeList>;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt?: Date;
}

export interface File {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt?: Date;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface ChangeList {
  changes: Change[];
  nextPageToken?: string;
}

export interface Change {
  fileId: string;
  type: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';
  file?: File;
  folder?: Folder;
  newName?: string;
  newParentId?: string;
}

export interface StorageConnection {
  id: number;
  userId: number;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  status: 'active' | 'disconnected' | 'error';
  lastError?: string;
  lastErrorAt?: Date;
  createdAt: Date;
}

export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;
