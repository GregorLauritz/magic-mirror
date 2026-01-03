/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDate(date, new Date());
};

/**
 * Check if two dates represent the same day
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Get ISO string for start of day (00:00:00.000Z)
 */
export const getISODayStartString = (date: Date): string => {
  return `${date.toISOString().split('T')[0]}T00:00:00.000Z`;
};

/**
 * Get ISO string for end of day (23:59:59.999Z)
 */
export const getISODayEndString = (date: Date): string => {
  return `${date.toISOString().split('T')[0]}T23:59:59.999Z`;
};

/**
 * ISO 8601 datetime format regex
 */
const ISO8601_REGEX = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)$/;

/**
 * Validate if string is in ISO 8601 datetime format
 */
export const isIso8601DatetimeString = (datetimeStr: string): boolean => {
  return ISO8601_REGEX.test(datetimeStr);
};

/**
 * Validate if string is a valid date
 */
export const isDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};

/**
 * Time units in milliseconds
 */
export enum TimeUnit {
  hours = 3600000,
  minutes = 60000,
  seconds = 1000,
}

/**
 * Calculate time difference between two dates in specified unit
 */
export const getTimeDiff = (date1: Date, date2: Date, unit: TimeUnit = TimeUnit.hours): number => {
  return Math.abs(date1.getTime() - date2.getTime()) / unit;
};
