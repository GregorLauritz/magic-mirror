import { Request, Response } from 'express';
import { WEATHER_API_URL, WEATHER_UNITS } from 'config';
import { ApiError } from 'models/api/api_error';
import { ApiResponse, Json } from 'models/api/fetch';
import { CurrentWeather } from 'models/api/weather';
import { getWeatherDescription, getWeatherIconFromWeathercode, sunIsCurrentlyUp } from 'routes/weather/services/common';

/**
 * Builds the URL for fetching current weather data
 * @param req - Express request with latitude, longitude, and timezone query params
 * @returns Weather API URL
 */
export const buildCurrentWeatherUrl = (req: Request): string => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    latitude: req.query.latitude as string,
    longitude: req.query.longitude as string,
    current_weather: 'true',
    start_date: todayDate,
    end_date: todayDate,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
    timezone: (req.query.timezone ?? 'GMT') as string,
    hourly: 'apparent_temperature',
    ...WEATHER_UNITS,
  });
  return `${WEATHER_API_URL}/forecast/?${params.toString()}`;
};

/**
 * Handles the weather API response and formats it for the client
 * @param res - Express response object
 * @param response - API response from weather service
 * @returns Express response with formatted weather data
 */
export const handleCurrentWeatherResponse = (res: Response, response: ApiResponse<Json>): Response => {
  if (response.status === 200) {
    return createResponse(res, response.body);
  } else if (response.status === 400) {
    throw new ApiError(response.body.reason ?? 'Error while calling weather API', new Error(), 400);
  } else {
    throw new ApiError('Error while retrieving the current weather', new Error(), 500);
  }
};

/**
 * Creates the HTTP response with formatted weather data
 */
const createResponse = (res: Response, response: Json): Response => {
  const responseJson = createResponseJson(response);
  return res.status(200).json(responseJson);
};

/**
 * Transforms raw weather API response into structured CurrentWeather object
 */
const createResponseJson = (response: Json): CurrentWeather => {
  const isDay = sunIsCurrentlyUp(response.daily.sunrise[0], response.daily.sunset[0]);
  const hourlyIndex = parseInt(response.current_weather.time.split('T')[1].split(':')[0]);
  return {
    latitude: response.latitude,
    longitude: response.longitude,
    temperature: {
      current: response.current_weather.temperature,
      min: response.daily.temperature_2m_min[0],
      max: response.daily.temperature_2m_max[0],
      feels_like: response.hourly.apparent_temperature[hourlyIndex],
      unit: response.current_weather_units.temperature,
    },
    precipitation: {
      value: response.daily.precipitation_sum[0],
      unit: response.daily_units.precipitation_sum,
    },
    windspeed: {
      value: response.current_weather.windspeed,
      unit: response.current_weather_units.windspeed,
    },
    weathercode: response.current_weather.weathercode,
    update_time: response.current_weather.time,
    weather_icon: getWeatherIconFromWeathercode(isDay, response.current_weather.weathercode),
    description: getWeatherDescription(response.current_weather.weathercode),
  };
};
