import { runtimeConfig } from './runtimeConfig'

export const WEATHER_ICON_ZOOM = runtimeConfig.weatherIconZoom

// Fallback coordinates (Stuttgart) used as default arguments by the legacy
// weather hooks. Removed together with those hooks when the weather slice
// moves to the application layer (plan step S3).
export const LATITUDE = 48.7749414
export const LONGITUDE = 9.1647386

export const HOURLY_FORECAST_HOURS = 5
export const DAILY_FORECAST_DAYS = 4
