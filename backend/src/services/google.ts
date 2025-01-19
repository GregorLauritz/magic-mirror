import { IncomingHttpHeaders } from 'http2';
import { getAccessToken } from './headers';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

const getOAuth2ClientForUser = async (headers: IncomingHttpHeaders): Promise<OAuth2Client> => {
  const access_token = await getAccessToken(headers);
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token });
  return client;
};

const getGoogleCalendar = async (req: Request) => {
  const auth = await getOAuth2ClientForUser(req.headers);
  return google.calendar({ version: 'v3', auth });
};

export { getOAuth2ClientForUser, getGoogleCalendar };
