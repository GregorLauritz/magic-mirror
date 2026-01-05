import { ALLOWED_URLS } from 'config';
import { ApiResponse, Json } from 'models/api/fetch';
import { LOGGER } from 'services/loggers';

/**
 * Fetches JSON data from an external API with URL validation and logging
 * @param url - URL to fetch from (must be in ALLOWED_URLS)
 * @param options - Fetch options (headers, method, etc.)
 * @param logUrl - Optional URL to display in logs (for security)
 * @returns API response with parsed JSON body
 * @throws Error if URL is not in allowed list
 */
export const fetchJson = async (
  url: string,
  options: RequestInit = {},
  logUrl?: string,
): Promise<ApiResponse<Json>> => {
  const displayUrl = logUrl ?? url;
  LOGGER.info(`Calling API ${displayUrl} to get JSON`);

  checkInputURL(url);

  try {
    const response = await fetch(url, options);
    LOGGER.info(`Call to API ${displayUrl} returned status code ${response.status}`);

    const body = await response.json();
    return {
      body,
      status: response.status,
      statusOk: response.ok,
    };
  } catch (err) {
    LOGGER.error(`Call to API ${displayUrl} returned error`, { error: err });
    throw err;
  }
};

/**
 * Fetches binary data (ArrayBuffer) from an external API
 * @param url - URL to fetch from (must be in ALLOWED_URLS)
 * @param options - Fetch options (headers, method, etc.)
 * @param logUrl - Optional URL to display in logs (for security)
 * @returns API response with ArrayBuffer body
 * @throws Error if URL is not in allowed list
 */
export const fetchBuffer = async (
  url: string,
  options: RequestInit = {},
  logUrl?: string,
): Promise<ApiResponse<ArrayBuffer>> => {
  const displayUrl = logUrl ?? url;
  LOGGER.info(`Calling API ${displayUrl} to get binary data`);

  checkInputURL(url);

  try {
    const response = await fetch(url, options);
    LOGGER.info(`Call to API ${displayUrl} returned status code ${response.status}`);

    const body = await response.arrayBuffer();
    return {
      body,
      status: response.status,
      statusOk: response.ok,
    };
  } catch (err) {
    LOGGER.error(`Call to API ${displayUrl} returned error`, { error: err });
    throw err;
  }
};

/**
 * Validates that a URL is in the allowed list for security
 * @param url - URL to validate
 * @throws Error if URL is not allowed
 */
const checkInputURL = (url: string): void => {
  const isAllowed = ALLOWED_URLS.some((allowedUrl) => url.startsWith(allowedUrl));
  if (!isAllowed) {
    throw new Error(`Invalid URL: ${url} is not in the allowed URL list`);
  }
};
