import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { fetchJson } from 'services/fetch';
import { buildHourlyWeatherUrl, getForecastHours, handleHourlyWeatherResponse } from 'routes/weather/services/hourly';

export const getHourlyWeather = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecastHours = await getForecastHours(req);
    const apiUrl = buildHourlyWeatherUrl(req);
    const apiResponse = await fetchJson(apiUrl);
    return handleHourlyWeatherResponse(res, apiResponse, forecastHours, (req.query.timezone ?? 'UTC') as string);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error retrieving hourly weather forecast', err as Error, 500));
  }
};
