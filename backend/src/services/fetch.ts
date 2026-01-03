import { ALLOWED_URLS } from 'config';
import { ApiResponse, Json } from 'models/api/fetch';
import { LOGGER } from 'services/loggers';

export const fetchJson = async (
  url: string,
  options: RequestInit = {},
  logUrl: string | undefined = undefined,
): Promise<ApiResponse<Json>> => {
  LOGGER.info(`Calling API ${logUrl ?? url} to get JSON`);
  return checkInputURL(url)
    .then(() => fetch(url, options))
    .then((response) => logFetch(response, logUrl ?? url))
    .then((response) => parseJsonResponse(response))
    .catch((err) => logFetchErr(err, logUrl ?? url));
};

const logFetch = async (res: Response, url: string): Promise<Response> => {
  LOGGER.info(`Call to API ${url} returned status code ${res.status}`);
  return res;
};

const logFetchErr = async (err: Error, url: string) => {
  LOGGER.error(`Call to API ${url} returned error '${err.message}'`);
  throw err;
};

const parseJsonResponse = async (res: Response): Promise<ApiResponse<Json>> => {
  return {
    body: await res.json(),
    status: res.status,
    statusOk: res.ok,
  };
};

export const fetchBuffer = async (
  url: string,
  options: RequestInit = {},
  logUrl: string | undefined = undefined,
): Promise<ApiResponse<ArrayBuffer>> => {
  LOGGER.info(`Calling API ${logUrl ?? url} to get BLOB`);
  return checkInputURL(url)
    .then(() => fetch(url, options))
    .then((response) => logFetch(response, logUrl ?? url))
    .then((response) => parseBufferResponse(response))
    .catch((err) => logFetchErr(err, logUrl ?? url));
};

const parseBufferResponse = async (res: Response): Promise<ApiResponse<ArrayBuffer>> => {
  return {
    body: await res.arrayBuffer(),
    status: res.status,
    statusOk: res.ok,
  };
};

const checkInputURL = async (url: string): Promise<void> => {
  const isAllowed = await isAllowedURL(url);
  await checkUrlAllowedResponse(isAllowed, url);
};

const isAllowedURL = async (url: string): Promise<boolean> => {
  return ALLOWED_URLS.some((allowed_url) => url.startsWith(allowed_url));
};

const checkUrlAllowedResponse = async (isAllowed: boolean, url: string) => {
  if (isAllowed) return;
  throw new Error(`Invalid URL given! URL ${url} is not part of the allowed URL list!`);
};
