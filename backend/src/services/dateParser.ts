/**
 * Checks if a date is today
 * @param date - Date to check
 * @returns True if the date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDate(date, new Date());
};

/**
 * Checks if two dates are the same calendar day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Gets ISO string for start of day (midnight)
 * @param date - Date to convert
 * @returns ISO 8601 string for 00:00:00.000Z on that day
 */
export const getISODayStartString = (date: Date): string => {
  return `${date.toISOString().split('T')[0]}T00:00:00.000Z`;
};

/**
 * Gets ISO string for end of day (23:59:59.999Z)
 * @param date - Date to convert
 * @returns ISO 8601 string for 23:59:59.999Z on that day
 */
export const getISODayEndString = (date: Date): string => {
  return `${date.toISOString().split('T')[0]}T23:59:59.999Z`;
};

const ISO8601_REGEX = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)$/;

/**
 * Validates if a string is a valid ISO 8601 datetime
 * @param datetimeStr - String to validate
 * @returns True if valid ISO 8601 format
 */
export const isIso8601DatetimeString = (datetimeStr: string): boolean => {
  return ISO8601_REGEX.test(datetimeStr);
};

/**
 * Checks if a string is a valid date
 * @param date - String to validate
 * @returns True if string can be parsed as a date
 */
export const isDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};

/**
 * Time units in milliseconds for date calculations
 */
export enum TimeUnit {
  hours = 3600000,
  minutes = 60000,
  seconds = 1000,
}

/**
 * Calculates the time difference between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @param unit - Time unit for the result (default: hours)
 * @returns Absolute time difference in specified units
 */
export const getTimeDiff = (date1: Date, date2: Date, unit: TimeUnit = TimeUnit.hours): number => {
  return Math.abs(date1.getTime() - date2.getTime()) / unit;
};
