import { IncomingHttpHeaders } from 'http';
import { getAccessToken } from './headers';
import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

/**
 * Creates an OAuth2 client with user credentials from forwarded headers
 * @param headers - HTTP request headers containing access token
 * @returns Configured OAuth2Client instance
 */
export const getOAuth2ClientForUser = (headers: IncomingHttpHeaders): OAuth2Client => {
  const accessToken = getAccessToken(headers);
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client;
};

/**
 * Creates a Google Calendar API client authenticated with user credentials
 * @param req - Express request object
 * @returns Google Calendar v3 API client
 */
export const getGoogleCalendar = (req: Request): calendar_v3.Calendar => {
  const auth = getOAuth2ClientForUser(req.headers);
  return google.calendar({ version: 'v3', auth });
};
