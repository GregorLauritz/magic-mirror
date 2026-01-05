import { weather_code_list, WeatherCodeEntry } from 'models/api/weather';
import { MAX_HOURLY_FORECAST_HOURS } from 'config';

/**
 * Gets the appropriate weather icon based on time of day
 * @param useDayIcons - True to use day icons, false for night icons
 * @param weathercode - Weather code from API
 * @returns Weather icon code
 */
export const getWeatherIconFromWeathercode = (useDayIcons: boolean, weathercode: number): string => {
  const entry = getWeatherCodeEntry(weathercode);
  return useDayIcons ? entry.weather_icon_day : entry.weather_icon_night;
};

/**
 * Gets human-readable description of weather conditions
 * @param weathercode - Weather code from API
 * @returns Weather description string
 */
export const getWeatherDescription = (weathercode: number): string => {
  const entry = getWeatherCodeEntry(weathercode);
  return entry.description;
};

/**
 * Looks up weather code entry from mapping table
 * @param weathercode - Weather code to look up
 * @returns Weather code entry with icons and description
 */
const getWeatherCodeEntry = (weathercode: number): WeatherCodeEntry => {
  const entry = weather_code_list.find((item) => item.weathercode === weathercode);
  return entry ?? unknown_weathercode_entry;
};

const unknown_weathercode_entry: WeatherCodeEntry = {
  weathercode: -1,
  description: 'Unknown weather',
  weather_icon_day: '00d',
  weather_icon_night: '00n',
};

/**
 * Checks if the sun is currently up based on sunrise/sunset times
 * @param sunrise - ISO string of sunrise time
 * @param sunset - ISO string of sunset time
 * @returns True if current time is between sunrise and sunset
 */
export const sunIsCurrentlyUp = (sunrise: string, sunset: string): boolean => {
  const now = new Date();
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  return dateIsDuringDay(now, sunriseDate, sunsetDate);
};

/**
 * Checks if a time falls between sunrise and sunset
 * @param time - Time to check
 * @param sunrise - Sunrise time
 * @param sunset - Sunset time
 * @returns True if time is during daylight hours
 */
export const dateIsDuringDay = (time: Date, sunrise: Date, sunset: Date): boolean => {
  return time.getTime() > sunrise.getTime() && time.getTime() < sunset.getTime();
};

/**
 * Checks if a time string falls during daylight hours
 * @param time - ISO time string to check
 * @param sunrise - ISO sunrise time string
 * @param sunset - ISO sunset time string
 * @returns True if time is during daylight hours
 */
export const timeIsDuringDay = (time: string, sunrise: string, sunset: string): boolean => {
  const timeDate = new Date(time);
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  return dateIsDuringDay(timeDate, sunriseDate, sunsetDate);
};

/**
 * Checks if a given time has already passed
 * @param time - ISO time string to check
 * @returns True if the time is in the past
 */
export const timeHasPassed = (time: string): boolean => {
  const timeDate = new Date(time);
  const now = new Date();
  return now.getTime() > timeDate.getTime();
};

/**
 * Checks if a time exceeds the maximum forecast window
 * @param time - ISO time string to check
 * @param maxTime - Maximum forecast hours (default: MAX_HOURLY_FORECAST_HOURS)
 * @returns True if time is beyond the forecast limit
 */
export const exceedsMaxForecastTime = (time: string, maxTime: number = MAX_HOURLY_FORECAST_HOURS): boolean => {
  const timeDate = new Date(time);
  const now = new Date();
  return (timeDate.getTime() - now.getTime()) / 3.6e6 > maxTime;
};
