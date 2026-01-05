import { Request, Response } from 'express';
import { MAX_HOURLY_FORECAST_HOURS, WEATHER_API_URL, WEATHER_UNITS } from 'config';
import { ApiError } from 'models/api/api_error';
import { ApiResponse, Json } from 'models/api/fetch';
import { HourlyWeather, HourlyWeatherResource } from 'models/api/weather';
import { DateTime } from 'luxon';
import {
  exceedsMaxForecastTime,
  getWeatherDescription,
  getWeatherIconFromWeathercode,
  timeHasPassed,
  timeIsDuringDay,
} from 'routes/weather/services/common';

/**
 * Builds URL for fetching hourly weather forecast
 */
export const buildHourlyWeatherUrl = (req: Request): string => {
  const date = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(date.getDate() + 1);
  const todayDateStr = date.toISOString().slice(0, 10);
  const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    start_date: todayDateStr,
    end_date: tomorrowDateStr,
    daily: 'sunrise,sunset',
    hourly: 'temperature_2m,windspeed_10m,precipitation,weathercode',
    latitude: req.query.latitude as string,
    longitude: req.query.longitude as string,
    timezone: 'UTC',
    CurrentWeather: 'true',
    ...WEATHER_UNITS,
  });
  return `${WEATHER_API_URL}/forecast/?${params.toString()}`;
};

/**
 * Handles hourly weather API response
 */
export const handleHourlyWeatherResponse = (
  res: Response,
  response: ApiResponse<Json>,
  forecastHours: number = MAX_HOURLY_FORECAST_HOURS,
  timezone?: string,
): Response => {
  if (response.status === 200) {
    return createResponse(res, response.body, forecastHours, timezone);
  } else if (response.status === 400) {
    throw new ApiError(response.body.reason ?? 'Error calling weather API', new Error(), 400);
  } else {
    throw new ApiError('Error retrieving hourly weather', new Error(), 500);
  }
};

/**
 * Extracts forecast hours from request or uses default
 */
export const getForecastHours = (req: Request): number => {
  return parseInt((req.query.hours as string) ?? String(MAX_HOURLY_FORECAST_HOURS));
};

/**
 * Creates the HTTP response with formatted hourly forecast data
 */
const createResponse = (res: Response, response: Json, forecastHours: number, timezone?: string): Response => {
  return res.status(200).json(createResponseJson(response, forecastHours, timezone));
};

/**
 * Transforms raw hourly weather API response into structured HourlyWeather object
 */
const createResponseJson = (response: Json, forecastHours: number, timezone: string = 'UTC'): HourlyWeather => {
  return {
    latitude: response.latitude,
    longitude: response.longitude,
    timezone: timezone,
    forecast: createForecastArray(response, forecastHours, timezone),
  };
};

/**
 * Creates array of hourly forecast resources, filtering by valid time range
 */
const createForecastArray = (
  response: Json,
  forecastHours: number,
  timezone: string = 'UTC',
): Array<HourlyWeatherResource> => {
  const forecast: Array<HourlyWeatherResource> = [];
  const count = response.hourly.time.length;
  for (let i = 0; i < count; i++) {
    if (isValidHourlyForecastTime(response.hourly.time[i], forecastHours)) {
      forecast.push(createForecastHour(response, i, timezone));
    }
  }
  return forecast;
};

/**
 * Checks if a time is valid for hourly forecast (not passed, within forecast window)
 */
const isValidHourlyForecastTime = (time: string, forecastHours: number): boolean => {
  return !timeHasPassed(time) && !exceedsMaxForecastTime(time, forecastHours);
};

/**
 * Creates a single hour's forecast data
 */
const createForecastHour = (response: Json, index: number, timezone: string = 'UTC'): HourlyWeatherResource => {
  const weathercode = response.hourly.weathercode[index];
  const time = response.hourly.time[index];
  const sunIsUp = timeIsDuringDay(time, response.daily.sunrise[0], response.daily.sunset[0]);
  const timeInZone = DateTime.fromISO(time, { zone: 'UTC' }).setZone(timezone).toFormat('yyyy-MM-dd HH:mm ZZZZ');
  return {
    time: timeInZone,
    temperature: response.hourly.temperature_2m[index],
    precipitation: response.hourly.precipitation[index],
    weather_icon: getWeatherIconFromWeathercode(sunIsUp, weathercode),
    windspeed: response.hourly.windspeed_10m[index],
    weathercode: weathercode,
    description: getWeatherDescription(weathercode),
  };
};
