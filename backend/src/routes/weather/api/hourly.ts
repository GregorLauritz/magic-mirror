import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { fetchJson } from 'services/fetch';
import { buildHourlyWeatherUrl, getForecastHours, handleHourlyWeatherResponse } from 'routes/weather/services/hourly';

export const getHourlyWeather = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const forecast_hours = await getForecastHours(req);
  return buildHourlyWeatherUrl(req)
    .then((url) => fetchJson(url))
    .then((response) => handleHourlyWeatherResponse(res, response, forecast_hours))
    .catch((err: ApiError) => next(err));
};
