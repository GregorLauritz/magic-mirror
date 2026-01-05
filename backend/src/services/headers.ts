import { IncomingHttpHeaders } from 'http';
import { ApiError } from 'models/api/api_error';

/**
 * Extracts the user ID from OAuth2-Proxy forwarded headers
 * @param headers - HTTP request headers
 * @returns The user's Google sub (subject identifier)
 * @throws ApiError if the header is missing
 */
export const getUserId = (headers: IncomingHttpHeaders): string => {
  const userId = headers['x-forwarded-user'];
  if (!userId || typeof userId !== 'string') {
    throw new ApiError('Missing or invalid x-forwarded-user header', undefined, 401);
  }
  return userId;
};

/**
 * Extracts the user email from OAuth2-Proxy forwarded headers
 * @param headers - HTTP request headers
 * @returns The user's email address
 * @throws ApiError if the header is missing
 */
export const getUserEmail = (headers: IncomingHttpHeaders): string => {
  const email = headers['x-forwarded-email'];
  if (!email || typeof email !== 'string') {
    throw new ApiError('Missing or invalid x-forwarded-email header', undefined, 401);
  }
  return email;
};

/**
 * Extracts the OAuth2 access token from OAuth2-Proxy forwarded headers
 * @param headers - HTTP request headers
 * @returns The OAuth2 access token
 * @throws ApiError if the header is missing
 */
export const getAccessToken = (headers: IncomingHttpHeaders): string => {
  const token = headers['x-forwarded-access-token'];
  if (!token || typeof token !== 'string') {
    throw new ApiError('Missing or invalid x-forwarded-access-token header', undefined, 401);
  }
  return token;
};

/**
 * Creates authentication header object for external API calls
 * @param headers - HTTP request headers
 * @returns RequestInit object with Authorization header
 */
export const getAuthenticationHeader = (headers: IncomingHttpHeaders): RequestInit => {
  const accessToken = getAccessToken(headers);
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};
