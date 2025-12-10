// Dropbox storage provider implementation
import { Dropbox, files } from 'dropbox';
import { IStorageProvider, Folder, File, TokenResponse, ChangeList, Change } from '../types/storage';
import { withRetry } from '../utils/retry';
import fetch from 'node-fetch';

export class DropboxProvider implements IStorageProvider {
  private dbx: Dropbox;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.dbx = new Dropbox({
      accessToken,
      fetch: fetch as any,
    });
  }

  async createFolder(name: string, parentId?: string): Promise<Folder> {
    return withRetry(async () => {
      const path = parentId ? `${parentId}/${name}` : `/${name}`;

      try {
        const response = await this.dbx.filesCreateFolderV2({ path });

        return {
          id: response.result.metadata.id,
          name: response.result.metadata.name,
          parentId: parentId,
        };
      } catch (error: any) {
        // If folder already exists, get it instead
        if (error.status === 409) {
          return this.getFolder(path);
        }
        throw error;
      }
    });
  }

  async getFolder(folderId: string): Promise<Folder> {
    return withRetry(async () => {
      const response = await this.dbx.filesGetMetadata({ path: folderId });

      if (response.result['.tag'] !== 'folder') {
        throw new Error('Path is not a folder');
      }

      const folder = response.result as files.FolderMetadata;
      return {
        id: folder.id,
        name: folder.name,
        parentId: folder.path_lower?.split('/').slice(0, -1).join('/') || undefined,
      };
    });
  }

  async listFolders(parentId: string): Promise<Folder[]> {
    return withRetry(async () => {
      const response = await this.dbx.filesListFolder({ path: parentId });

      return response.result.entries
        .filter((entry) => entry['.tag'] === 'folder')
        .map((entry) => {
          const folder = entry as files.FolderMetadata;
          return {
            id: folder.id,
            name: folder.name,
            parentId: parentId,
          };
        });
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    name: string,
    mimeType: string,
    folderId: string
  ): Promise<File> {
    return withRetry(async () => {
      const path = `${folderId}/${name}`;

      // Use simple upload for files < 150MB
      const response = await this.dbx.filesUpload({
        path,
        contents: fileBuffer,
        mode: { '.tag': 'add' },
        autorename: true,
        mute: false,
      });

      return {
        id: response.result.id,
        name: response.result.name,
        mimeType: mimeType,
        size: response.result.size,
        url: await this.getSharedLink(response.result.id),
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
      const path = `${folderId}/${name}`;
      const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks

      // Read the stream into chunks
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk as Buffer);
      }
      const fileBuffer = Buffer.concat(chunks);

      // Start upload session
      const startResponse = await this.dbx.filesUploadSessionStart({
        close: false,
        contents: fileBuffer.slice(0, CHUNK_SIZE),
      });

      const sessionId = startResponse.result.session_id;
      let offset = CHUNK_SIZE;

      // Upload remaining chunks
      while (offset < size) {
        const end = Math.min(offset + CHUNK_SIZE, size);
        const chunk = fileBuffer.slice(offset, end);
        const isLastChunk = end >= size;

        if (isLastChunk) {
          // Finish the session
          const finishResponse = await this.dbx.filesUploadSessionFinish({
            cursor: {
              session_id: sessionId,
              offset: offset,
            },
            commit: {
              path,
              mode: { '.tag': 'add' },
              autorename: true,
              mute: false,
            },
            contents: chunk,
          });

          return {
            id: finishResponse.result.id,
            name: finishResponse.result.name,
            mimeType: mimeType,
            size: finishResponse.result.size,
            url: await this.getSharedLink(finishResponse.result.id),
          };
        } else {
          // Append to session
          await this.dbx.filesUploadSessionAppendV2({
            cursor: {
              session_id: sessionId,
              offset: offset,
            },
            close: false,
            contents: chunk,
          });
        }

        offset = end;
      }

      throw new Error('Upload session ended unexpectedly');
    });
  }

  async getFile(fileId: string): Promise<File> {
    return withRetry(async () => {
      const response = await this.dbx.filesGetMetadata({ path: fileId });

      if (response.result['.tag'] !== 'file') {
        throw new Error('Path is not a file');
      }

      const file = response.result as files.FileMetadata;
      return {
        id: file.id,
        name: file.name,
        mimeType: '', // Dropbox doesn't provide MIME type in metadata
        size: file.size,
        url: await this.getSharedLink(file.id),
      };
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    return withRetry(async () => {
      await this.dbx.filesDeleteV2({ path: fileId });
    });
  }

  async getFileUrl(fileId: string): Promise<string> {
    return this.getSharedLink(fileId);
  }

  private async getSharedLink(fileId: string): Promise<string> {
    try {
      const response = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: fileId,
        settings: {
          requested_visibility: { '.tag': 'public' },
        },
      });
      return response.result.url;
    } catch (error: any) {
      // If link already exists, get it
      if (error.status === 409) {
        const linksResponse = await this.dbx.sharingListSharedLinks({ path: fileId });
        if (linksResponse.result.links.length > 0) {
          return linksResponse.result.links[0].url;
        }
      }
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.DROPBOX_APP_KEY!,
        client_secret: process.env.DROPBOX_APP_SECRET!,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Dropbox access token');
    }

    const data: any = await response.json();

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async getChanges(pageToken?: string): Promise<ChangeList> {
    return withRetry(async () => {
      const cursor = pageToken || await this.getLatestCursor();

      const response = await this.dbx.filesListFolderContinue({ cursor });

      const changes: Change[] = response.result.entries.map((entry) => {
        if (entry['.tag'] === 'deleted') {
          return {
            fileId: entry.path_lower || '',
            type: 'deleted' as const,
          };
        }

        if (entry['.tag'] === 'file') {
          const file = entry as files.FileMetadata;
          return {
            fileId: file.id,
            type: 'modified' as const,
            file: {
              id: file.id,
              name: file.name,
              mimeType: '',
              size: file.size,
              url: '',
            },
          };
        }

        return {
          fileId: entry.path_lower || '',
          type: 'modified' as const,
        };
      });

      return {
        changes,
        nextPageToken: response.result.has_more ? response.result.cursor : undefined,
      };
    });
  }

  private async getLatestCursor(): Promise<string> {
    const response = await this.dbx.filesListFolderGetLatestCursor({
      path: '',
      recursive: true,
    });
    return response.result.cursor;
  }
}
