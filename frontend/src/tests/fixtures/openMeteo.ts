// Hand-authored Open-Meteo payloads in the shape returned with
// `timeformat=unixtime` (times are UTC epoch seconds; daily timestamps are
// local midnight, so a date needs `utc_offset_seconds` applied again).
// Replace with recorded real responses once a networked environment exists.

export const unix = (iso: string): number => Date.parse(iso) / 1000
const HOUR = 3600

export interface FixtureZone {
    readonly name: string
    readonly offsetSeconds: number
}

export const TOKYO: FixtureZone = { name: 'Asia/Tokyo', offsetSeconds: 32_400 }
export const KOLKATA: FixtureZone = {
    name: 'Asia/Kolkata',
    offsetSeconds: 19_800,
}

// Local midnight of 2024-01-15 in Tokyo is 2024-01-14T15:00:00Z
export const TOKYO_MIDNIGHT = unix('2024-01-14T15:00:00Z')

const hourly48 = (start: number): number[] =>
    Array.from({ length: 48 }, (_, i) => start + i * HOUR)

export const currentResponse = (
    overrides: Record<string, unknown> = {},
    zone: FixtureZone = TOKYO
) => ({
    latitude: 35.7,
    longitude: 139.7,
    utc_offset_seconds: zone.offsetSeconds,
    timezone: zone.name,
    current_weather_units: {
        time: 'unixtime',
        interval: 'seconds',
        temperature: '°C',
        windspeed: 'km/h',
        winddirection: '°',
        is_day: '',
        weathercode: 'wmo code',
    },
    current_weather: {
        time: unix('2024-01-15T03:00:00Z'), // 12:00 in Tokyo
        interval: 900,
        temperature: 6.5,
        windspeed: 11.2,
        winddirection: 300,
        is_day: 1,
        weathercode: 3,
    },
    hourly_units: { time: 'unixtime', apparent_temperature: '°C' },
    hourly: {
        time: hourly48(TOKYO_MIDNIGHT).slice(0, 24),
        apparent_temperature: Array.from({ length: 24 }, (_, i) => i - 10),
    },
    daily_units: {
        time: 'unixtime',
        temperature_2m_max: '°C',
        temperature_2m_min: '°C',
        precipitation_sum: 'mm',
        sunrise: 'unixtime',
        sunset: 'unixtime',
    },
    daily: {
        time: [TOKYO_MIDNIGHT],
        temperature_2m_max: [9.1],
        temperature_2m_min: [1.2],
        precipitation_sum: [0.4],
        sunrise: [unix('2024-01-14T21:50:00Z')], // 06:50 in Tokyo
        sunset: [unix('2024-01-15T07:45:00Z')], // 16:45 in Tokyo
    },
    ...overrides,
})

/** 48 hourly entries from Tokyo midnight; temperature_2m[i] === i. */
export const hourlyResponse = (overrides: Record<string, unknown> = {}) => ({
    latitude: 35.7,
    longitude: 139.7,
    utc_offset_seconds: TOKYO.offsetSeconds,
    timezone: TOKYO.name,
    hourly_units: {
        time: 'unixtime',
        temperature_2m: '°C',
        windspeed_10m: 'km/h',
        precipitation: 'mm',
        weathercode: 'wmo code',
    },
    hourly: {
        time: hourly48(TOKYO_MIDNIGHT),
        temperature_2m: Array.from({ length: 48 }, (_, i) => i),
        windspeed_10m: Array.from({ length: 48 }, (_, i) => i + 100),
        precipitation: Array.from({ length: 48 }, () => 0),
        weathercode: Array.from({ length: 48 }, () => 1),
    },
    daily_units: { time: 'unixtime', sunrise: 'unixtime', sunset: 'unixtime' },
    daily: {
        time: [TOKYO_MIDNIGHT, TOKYO_MIDNIGHT + 24 * HOUR],
        sunrise: [
            unix('2024-01-14T21:50:00Z'), // 06:50 on the 15th in Tokyo
            unix('2024-01-15T21:51:00Z'), // 06:51 on the 16th
        ],
        sunset: [
            unix('2024-01-15T07:45:00Z'), // 16:45 on the 15th
            unix('2024-01-16T07:46:00Z'), // 16:46 on the 16th
        ],
    },
    ...overrides,
})

/** Five local days starting 2024-01-15 in Tokyo. */
export const dailyResponse = (overrides: Record<string, unknown> = {}) => ({
    latitude: 35.7,
    longitude: 139.7,
    utc_offset_seconds: TOKYO.offsetSeconds,
    timezone: TOKYO.name,
    daily_units: {
        time: 'unixtime',
        temperature_2m_max: '°C',
        temperature_2m_min: '°C',
        precipitation_sum: 'mm',
        precipitation_hours: 'h',
        weathercode: 'wmo code',
        sunrise: 'unixtime',
        sunset: 'unixtime',
        wind_speed_10m_max: 'km/h',
    },
    daily: {
        time: Array.from(
            { length: 5 },
            (_, i) => TOKYO_MIDNIGHT + i * 24 * HOUR
        ),
        temperature_2m_max: [9, 10, 11, 12, 13],
        temperature_2m_min: [1, 2, 3, 4, 5],
        precipitation_sum: [0, 0.5, 1, 1.5, 2],
        precipitation_hours: [0, 1, 2, 3, 4],
        weathercode: [0, 3, 61, 71, 95],
        sunrise: Array.from(
            { length: 5 },
            (_, i) => TOKYO_MIDNIGHT + 6.8 * HOUR + i * 24 * HOUR
        ),
        sunset: Array.from(
            { length: 5 },
            (_, i) => TOKYO_MIDNIGHT + 16.7 * HOUR + i * 24 * HOUR
        ),
        wind_speed_10m_max: [5, 6, 7, 8, 9],
    },
    ...overrides,
})
