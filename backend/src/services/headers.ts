import { IncomingHttpHeaders } from 'http2';

/**
 * Extract user ID from OAuth proxy headers
 */
export const getUserId = (headers: IncomingHttpHeaders): string => {
  return headers['x-forwarded-user'] as string;
};

/**
 * Extract user email from OAuth proxy headers
 */
export const getUserEmail = (headers: IncomingHttpHeaders): string => {
  return headers['x-forwarded-email'] as string;
};

/**
 * Extract access token from OAuth proxy headers
 */
export const getAccessToken = (headers: IncomingHttpHeaders): string => {
  return headers['x-forwarded-access-token'] as string;
};

/**
 * Build authentication header object for API requests
 */
export const getAuthenticationHeader = (headers: IncomingHttpHeaders): RequestInit => {
  const accessToken = getAccessToken(headers);
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};
