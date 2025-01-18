import { Request, Response } from 'express';
import { WEATHER_API_URL, WEATHER_UNITS } from 'config';
import { ApiError } from 'models/api/api_error';
import { ApiResponse, Json } from 'models/api/fetch';
import { CurrentWeather } from 'models/api/weather';
import { getWeatherDescription, getWeatherIconFromWeathercode, sunIsCurrentlyUp } from 'routes/weather/services/common';

export const buildCurrentWeatherUrl = async (req: Request): Promise<string> => {
  const today_date = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    latitude: req.query.latitude as string,
    longitude: req.query.longitude as string,
    current_weather: 'true',
    start_date: today_date,
    end_date: today_date,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
    timezone: (req.query.timezone ?? 'GMT') as string,
    hourly: 'apparent_temperature',
    ...WEATHER_UNITS,
  });
  return `${WEATHER_API_URL}/forecast/?${params.toString()}`;
};

export const handleCurrentWeatherResponse = async (res: Response, response: ApiResponse<Json>): Promise<Response> => {
  if (response.status === 200) {
    return createResponse(res, response.body);
  } else if (response.status === 400) {
    throw new ApiError(response.body.reason ?? 'Error while calling weather API', new Error(), 400);
  } else {
    throw new ApiError('Error while retrieving the current weather', new Error(), 500);
  }
};

const createResponse = async (res: Response, response: Json): Promise<Response> => {
  const responseJson = await createResponseJson(response);
  return res.status(200).json(responseJson);
};

const createResponseJson = async (response: Json): Promise<CurrentWeather> => {
  const isDay = await sunIsCurrentlyUp(response.daily.sunrise[0], response.daily.sunset[0]);
  const hourlyIndex = parseInt(response.current_weather.time.split('T')[1].split(':')[0]);
  return {
    latitude: response.latitude,
    longitude: response.longitude,
    temperature: {
      current: response.current_weather.temperature,
      min: response.daily.temperature_2m_min[0],
      max: response.daily.temperature_2m_max[0],
      feels_like: response.hourly.apparent_temperature[hourlyIndex],
    },
    precipitation_sum: response.daily.precipitation_sum[0],
    windspeed: response.current_weather.windspeed,
    weathercode: response.current_weather.weathercode,
    update_time: response.current_weather.time,
    weather_icon: await getWeatherIconFromWeathercode(isDay, response.current_weather.weathercode),
    description: await getWeatherDescription(response.current_weather.weathercode),
  };
};
