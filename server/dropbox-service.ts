import { Dropbox } from 'dropbox';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const dbx = new Dropbox({
  clientId: process.env.DROPBOX_APP_KEY,
  clientSecret: process.env.DROPBOX_APP_SECRET,
});

export const getDropboxAuthUrl = (userId: string) => {
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(process.env.DROPBOX_REDIRECT_URI!)}&state=${userId}`;
  return authUrl;
};

export const getDropboxAccessToken = async (code: string) => {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.DROPBOX_REDIRECT_URI!,
      client_id: process.env.DROPBOX_APP_KEY!,
      client_secret: process.env.DROPBOX_APP_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Dropbox access token');
  }

  return await response.json();
};
