// Google Drive storage provider implementation
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { IStorageProvider, Folder, File, TokenResponse, ChangeList, Change } from '../types/storage';
import { withRetry, isNetworkError, isRateLimitError } from '../utils/retry';
import { Readable } from 'stream';

export class GoogleDriveProvider implements IStorageProvider {
  private drive: drive_v3.Drive;
  private oauth2Client: OAuth2Client;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async createFolder(name: string, parentId?: string): Promise<Folder> {
    return withRetry(async () => {
      const fileMetadata: drive_v3.Schema$File = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] }),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, parents, createdTime',
      });

      if (!response.data.id || !response.data.name) {
        throw new Error('Failed to create folder: missing required fields');
      }

      return {
        id: response.data.id,
        name: response.data.name,
        parentId: response.data.parents?.[0],
        createdAt: response.data.createdTime ? new Date(response.data.createdTime) : undefined,
      };
    });
  }

  async getFolder(folderId: string): Promise<Folder> {
    return withRetry(async () => {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, parents, createdTime',
      });

      if (!response.data.id || !response.data.name) {
        throw new Error('Folder not found');
      }

      return {
        id: response.data.id,
        name: response.data.name,
        parentId: response.data.parents?.[0],
        createdAt: response.data.createdTime ? new Date(response.data.createdTime) : undefined,
      };
    });
  }

  async listFolders(parentId: string): Promise<Folder[]> {
    return withRetry(async () => {
      const response = await this.drive.files.list({
        q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, parents, createdTime)',
      });

      return (response.data.files || []).map((file) => ({
        id: file.id!,
        name: file.name!,
        parentId: file.parents?.[0],
        createdAt: file.createdTime ? new Date(file.createdTime) : undefined,
      }));
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    name: string,
    mimeType: string,
    folderId: string
  ): Promise<File> {
    return withRetry(async () => {
      const fileMetadata: drive_v3.Schema$File = {
        name,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: Readable.from(fileBuffer),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime',
      });

      if (!response.data.id || !response.data.name) {
        throw new Error('Failed to upload file: missing required fields');
      }

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType || mimeType,
        size: parseInt(response.data.size || '0'),
        url: response.data.webViewLink || response.data.webContentLink || '',
        thumbnailUrl: response.data.thumbnailLink || undefined,
        createdAt: response.data.createdTime ? new Date(response.data.createdTime) : undefined,
      };
    });
  }

  async uploadFileResumable(
    fileStream: NodeJS.ReadableStream,
    name: string,
    mimeType: string,
    size: number,
    folderId: string
  ): Promise<File> {
    return withRetry(async () => {
      const fileMetadata: drive_v3.Schema$File = {
        name,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: fileStream,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime',
      });

      if (!response.data.id || !response.data.name) {
        throw new Error('Failed to upload file: missing required fields');
      }

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType || mimeType,
        size: parseInt(response.data.size || '0'),
        url: response.data.webViewLink || response.data.webContentLink || '',
        thumbnailUrl: response.data.thumbnailLink || undefined,
        createdAt: response.data.createdTime ? new Date(response.data.createdTime) : undefined,
      };
    });
  }

  async getFile(fileId: string): Promise<File> {
    return withRetry(async () => {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime',
      });

      if (!response.data.id || !response.data.name) {
        throw new Error('File not found');
      }

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType || '',
        size: parseInt(response.data.size || '0'),
        url: response.data.webViewLink || response.data.webContentLink || '',
        thumbnailUrl: response.data.thumbnailLink || undefined,
        createdAt: response.data.createdTime ? new Date(response.data.createdTime) : undefined,
      };
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    return withRetry(async () => {
      await this.drive.files.delete({ fileId });
    });
  }

  async getFileUrl(fileId: string): Promise<string> {
    return withRetry(async () => {
      const response = await this.drive.files.get({
        fileId,
        fields: 'webContentLink, webViewLink',
      });

      return response.data.webContentLink || response.data.webViewLink || '';
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || undefined,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(),
    };
  }

  async getChanges(pageToken?: string): Promise<ChangeList> {
    return withRetry(async () => {
      const response = await this.drive.changes.list({
        pageToken: pageToken || await this.getStartPageToken(),
        fields: 'changes(fileId, removed, file(id, name, mimeType, size, parents, trashed)), nextPageToken',
      });

      const changes: Change[] = (response.data.changes || []).map((change) => {
        if (change.removed || change.file?.trashed) {
          return {
            fileId: change.fileId!,
            type: 'deleted' as const,
          };
        }

        const file = change.file!;
        return {
          fileId: file.id!,
          type: 'modified' as const,
          file: {
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType || '',
            size: parseInt(file.size || '0'),
            url: '',
          },
        };
      });

      return {
        changes,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    });
  }

  private async getStartPageToken(): Promise<string> {
    const response = await this.drive.changes.getStartPageToken();
    return response.data.startPageToken || '1';
  }
}
