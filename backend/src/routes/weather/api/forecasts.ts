import { NextFunction, Request, Response } from 'express';
import { buildWeatherForecastUrl, handleWeatherForecastResponse } from 'routes/weather/services/forecast';
import { fetchJson } from 'services/fetch';
import { ApiError } from 'models/api/api_error';

/**
 * Route handler for getting daily weather forecast
 */
export const getWeatherForecast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const url = buildWeatherForecastUrl(req);
    const response = await fetchJson(url);
    handleWeatherForecastResponse(res, response);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error retrieving weather forecast', err as Error, 500));
  }
};
