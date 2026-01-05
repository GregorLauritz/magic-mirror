import { IDatabaseConnection } from 'services/database/database';
import { randomUUID } from 'crypto';

export const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? String(3001));
export const SESSION_SECRET = process.env.SESSION_SECRET ?? randomUUID();
export const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME ?? 'localhost';
export const ENABLE_HTTPS = (process.env.ENABLE_HTTPS?.toLowerCase() ?? 'false') === 'true';
export const SSL_PRIVATE_KEY = process.env.SSL_PRIVATE_KEY ?? '/etc/express/express.key';
export const SSL_CERTIFICATE = process.env.SSL_CERTIFICATE ?? '/etc/express/express.pem';

export const mongoDbData: IDatabaseConnection = {
  hostname: process.env.MONGO_HOSTNAME ?? 'mongo',
  port: parseInt(process.env.MONGO_PORT ?? '27017'),
  username: process.env.MONGO_USERNAME,
  password: process.env.MONGO_PASSWORD,
  database: process.env.MONGO_DATABASE,
  options: [
    {
      name: 'authSource',
      value: 'admin',
    },
    {
      name: 'ssl',
      value: process.env.MONGO_SSL ?? 'false',
    },
  ],
};

export const CALENDAR_CONFIG = {
  BIRTHDAY_ID: 'addressbook#contacts@group.v.calendar.google.com',
  DEFAULT_EVENT_COUNT: 100,
};

export const OPENWEATHER_URL = 'https://openweathermap.org';
export const GEOCODE_URL = 'https://geocode.maps.co';
export const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY ?? '';
export const WEATHER_API_URL = 'https://api.open-meteo.com/v1';
export const WEATHER_UNITS = new URLSearchParams({
  timezone: 'GMT%2B0',
  temperature_unit: 'celsius',
  windspeed_unit: 'kmh',
  precipitation_unit: 'mm',
  timeformat: 'iso8601',
});
export const STD_API_QUERY = WEATHER_UNITS.toString();
export const WEATHER_ICON_URL = 'https://openweathermap.org';
export const MAX_FORECAST_DAYS = 9;
export const MAX_HOURLY_FORECAST_HOURS = 24;

export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost';
export const REDIRECT_URI = process.env.REDIRECT_URI ?? `${FRONTEND_URL}/`;
export const REGISTER_REDIRECT_URI = process.env.REGISTER_REDIRECT_URI ?? `${FRONTEND_URL}/registration`;
export const FAILURE_REDIRECT_URI = process.env.FAILURE_REDIRECT_URI ?? `${FRONTEND_URL}/error`;

export const ALLOWED_URLS = [WEATHER_API_URL, OPENWEATHER_URL, GEOCODE_URL];

export const RATE_LIMIT = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500,
  validate: {
    xForwardedForHeader: false,
  },
};
