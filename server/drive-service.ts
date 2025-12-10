import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import stream from 'stream';

export const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getDrive = (auth: OAuth2Client) => {
  return google.drive({ version: 'v3', auth });
};

export const uploadFile = async (auth: OAuth2Client, fileName: string, mimeType: string, fileStream: stream.Readable) => {
  const drive = getDrive(auth);
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: mimeType,
    },
    media: {
      mimeType: mimeType,
      body: fileStream,
    },
  });
  return response.data;
};
