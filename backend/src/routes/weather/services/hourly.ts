import { Request, Response } from 'express';
import { MAX_HOURLY_FORECAST_HOURS, WEATHER_API_URL, WEATHER_UNITS } from 'config';
import { ApiError } from 'models/api/api_error';
import { ApiResponse, Json } from 'models/api/fetch';
import { HourlyWeather, HourlyWeatherResource } from 'models/api/weather';
import {
  exceedsMaxForecastTime,
  getWeatherDescription,
  getWeatherIconFromWeathercode,
  timeHasPassed,
  timeIsDuringDay,
} from 'routes/weather/services/common';

export const buildHourlyWeatherUrl = async (req: Request): Promise<string> => {
  const date = new Date();
  const tmrw_date = new Date();
  tmrw_date.setDate(date.getDate() + 1);
  const today_date_str = date.toISOString().slice(0, 10);
  const tmrw_date_str = tmrw_date.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    start_date: today_date_str,
    end_date: tmrw_date_str,
    daily: 'sunrise,sunset',
    hourly: 'temperature_2m,windspeed_10m,precipitation,weathercode',
    latitude: req.query.latitude as string,
    longitude: req.query.longitude as string,
    timezone: (req.query.timezone ?? 'GMT') as string,
    CurrentWeather: 'true',
    ...WEATHER_UNITS,
  });
  return `${WEATHER_API_URL}/forecast/?${params.toString()}`;
};

export const handleHourlyWeatherResponse = async (
  res: Response,
  response: ApiResponse<Json>,
  forecast_hours: number = MAX_HOURLY_FORECAST_HOURS,
): Promise<Response> => {
  if (response.status === 200) {
    return createResponse(res, response.body, forecast_hours);
  } else if (response.status === 400) {
    throw new ApiError(response.body.reason ?? 'Error while calling weather API', new Error(), 400);
  } else {
    throw new ApiError('Error while retrieving the current weather', new Error(), 400);
  }
};

export const getForecastHours = async (req: Request): Promise<number> => {
  const hour_query_param = parseInt(((req.query.hours as string) ?? MAX_HOURLY_FORECAST_HOURS).toString());
  return hour_query_param;
};

const createResponse = async (res: Response, response: Json, forecast_hours: number): Promise<Response> => {
  return res.status(200).json(await createResponseJson(response, forecast_hours));
};

const createResponseJson = async (response: Json, forecast_hours: number): Promise<HourlyWeather> => {
  return {
    latitude: response.latitude,
    longitude: response.longitude,
    timezone: response.timezone,
    forecast: await createForecastArray(response, forecast_hours),
  };
};

const createForecastArray = async (response: Json, forecast_hours: number): Promise<Array<HourlyWeatherResource>> => {
  const forecast: Array<Promise<HourlyWeatherResource>> = [];
  const count = response.hourly.time.length;
  for (let i = 0; i < count; i++) {
    if (await isValidHourlyForecastTime(response.hourly.time[i], forecast_hours)) {
      forecast.push(createForecastHour(response, i));
    }
  }
  return Promise.all(forecast);
};

const isValidHourlyForecastTime = async (time: string, forecast_hours: number): Promise<boolean> => {
  return (await timeHasPassed(time)) === false && (await exceedsMaxForecastTime(time, forecast_hours)) === false;
};

const createForecastHour = async (response: Json, index: number): Promise<HourlyWeatherResource> => {
  const weathercode = response.hourly.weathercode[index];
  const time = response.hourly.time[index];
  const sunIsUp = await timeIsDuringDay(time, response.daily.sunrise[0], response.daily.sunset[0]);
  return {
    time: time,
    temperature: response.hourly.temperature_2m[index],
    precipitation: response.hourly.precipitation[index],
    weather_icon: await getWeatherIconFromWeathercode(sunIsUp, weathercode),
    windspeed: response.hourly.windspeed_10m[index],
    weathercode: weathercode,
    description: await getWeatherDescription(weathercode),
  };
};
