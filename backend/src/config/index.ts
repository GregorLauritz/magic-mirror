import { IDatabaseConnection } from 'services/database/database';
import { randomUUID } from 'crypto';

export const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? String(3001));
export const SESSION_SECRET = process.env.SESSION_SECRET ?? randomUUID();
export const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME ?? 'localhost';

export const ferretDbData: IDatabaseConnection = {
  hostname: process.env.FERRETDB_HOSTNAME ?? 'ferretdb',
  port: parseInt(process.env.FERRETDB_PORT ?? '27017'),
  username: process.env.FERRETDB_USERNAME,
  password: process.env.FERRETDB_PASSWORD,
  database: process.env.FERRETDB_DATABASE ?? 'magic-mirror',
  options: [
    {
      name: 'authSource',
      value: 'admin',
    },
    {
      name: 'ssl',
      value: process.env.FERRETDB_SSL ?? 'false',
    },
    ...(process.env.FERRETDB_SSL?.toLowerCase() === 'true'
      ? [
          {
            name: 'tlsCAFile',
            value: process.env.FERRETDB_SSL_CA_FILE ?? '/etc/ferretdb/rootCA.pem',
          },
        ]
      : []),
    {
      name: 'authMechanism',
      value: 'PLAIN',
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

export const DB_API_BASE_URL = 'https://v6.db.transport.rest';

export const ALLOWED_URLS = [WEATHER_API_URL, OPENWEATHER_URL, GEOCODE_URL, DB_API_BASE_URL];

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const RATE_LIMIT = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500,
  validate: {
    xForwardedForHeader: false,
  },
};
