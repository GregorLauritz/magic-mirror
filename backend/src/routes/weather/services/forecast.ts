import { Request, Response } from 'express';
import { MAX_FORECAST_DAYS, WEATHER_API_URL, WEATHER_UNITS } from 'config';
import { ApiError } from 'models/api/api_error';
import { ApiResponse, Json } from 'models/api/fetch';
import { WeatherForecast, WeatherForecastResource } from 'models/api/weather';
import { getWeatherDescription, getWeatherIconFromWeathercode } from 'routes/weather/services/common';

/**
 * Builds URL for fetching daily weather forecast
 */
export const buildWeatherForecastUrl = (req: Request): string => {
  const startDate = getDateInDays(1).toISOString().slice(0, 10);
  const endDate = getForecastEndDate(req).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    latitude: req.query.latitude as string,
    longitude: req.query.longitude as string,
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,weathercode,sunrise,sunset',
    timezone: (req.query.timezone ?? 'GMT') as string,
    ...WEATHER_UNITS,
  });
  return `${WEATHER_API_URL}/forecast/?${params.toString()}`;
};

/**
 * Calculates the end date for the forecast based on request parameters
 */
const getForecastEndDate = (req: Request): Date => {
  const forecastDays = getForecastDays(req);
  return getDateInDays(forecastDays);
};

/**
 * Gets a date N days from today
 */
const getDateInDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Extracts forecast days from request or uses default
 */
export const getForecastDays = (req: Request): number => {
  return parseInt((req.query.days as string) ?? String(MAX_FORECAST_DAYS));
};

/**
 * Handles weather forecast API response
 */
export const handleWeatherForecastResponse = (res: Response, response: ApiResponse<Json>): Response => {
  if (response.status === 200) {
    return createResponse(res, response.body);
  } else if (response.status === 400) {
    throw new ApiError(response.body.reason ?? 'Error calling weather forecast API', new Error(), 400);
  } else {
    throw new ApiError('Error retrieving weather forecast', new Error(), 500);
  }
};

/**
 * Creates the HTTP response with formatted forecast data
 */
const createResponse = (res: Response, response: Json): Response => {
  return res.status(200).json(createResponseJson(response));
};

/**
 * Transforms raw forecast API response into structured WeatherForecast object
 */
const createResponseJson = (response: Json): WeatherForecast => {
  return {
    latitude: response.latitude,
    longitude: response.longitude,
    timezone: response.timezone,
    days: response.daily.time.length,
    forecast: createForecastArray(response),
  };
};

/**
 * Creates array of daily forecast resources
 */
const createForecastArray = (response: Json): Array<WeatherForecastResource> => {
  const count = response.daily.time.length;
  const forecast: Array<WeatherForecastResource> = [];
  for (let i = 0; i < count; i++) {
    forecast.push(createForecastDay(response, i));
  }
  return forecast;
};

/**
 * Creates a single day's forecast data
 */
const createForecastDay = (response: Json, index: number): WeatherForecastResource => {
  const weathercode = response.daily.weathercode[index];
  return {
    date: response.daily.time[index],
    temperature: {
      min: response.daily.temperature_2m_min[index],
      max: response.daily.temperature_2m_max[index],
      unit: response.daily_units.temperature_2m_max,
    },
    precipitation: {
      amount: response.daily.precipitation_sum[index],
      hours: response.daily.precipitation_hours[index],
      amount_unit: response.daily_units.precipitation_sum,
    },
    weather_icon: getWeatherIconFromWeathercode(true, weathercode),
    sunrise: response.daily.sunrise[index],
    sunset: response.daily.sunset[index],
    weathercode: weathercode,
    description: getWeatherDescription(weathercode),
  };
};
