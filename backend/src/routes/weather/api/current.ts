import { NextFunction, Request, Response } from 'express';
import { buildCurrentWeatherUrl, handleCurrentWeatherResponse } from 'routes/weather/services/current';
import { fetchJson } from 'services/fetch';
import { ApiError } from 'models/api/api_error';

/**
 * Route handler for getting current weather conditions
 */
export const getCurrentWeather = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const url = buildCurrentWeatherUrl(req);
    const response = await fetchJson(url);
    handleCurrentWeatherResponse(res, response);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error retrieving current weather', err as Error, 500));
  }
};
