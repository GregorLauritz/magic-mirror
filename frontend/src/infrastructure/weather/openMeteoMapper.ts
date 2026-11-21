import { ProviderResponseError } from '@/application/ports/errors'
import type { Measurement } from '@/domain/shared/Measurement'
import { instant, toPlainDate, type Instant } from '@/domain/shared/time'
import { isDaylight, type SunWindow } from '@/domain/weather/daylight'
import type {
    CurrentWeather,
    DailyEntry,
    HourlyEntry,
} from '@/domain/weather/types'
import { makeCondition } from '@/domain/weather/WeatherCondition'

// Maps Open-Meteo responses requested with `timeformat=unixtime` to domain
// objects. Times arrive as UTC epoch seconds, so no zone-less string is ever
// parsed; daily timestamps are local midnight and need `utc_offset_seconds`
// applied again to read the calendar date. Anything unexpected becomes a
// ProviderResponseError instead of a TypeError deep inside a component.

type Json = Readonly<Record<string, unknown>>

const bad = (path: string): never => {
    throw new ProviderResponseError(
        `Open-Meteo response: "${path}" is missing or malformed`
    )
}

const record = (value: unknown, path: string): Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Json)
        : bad(path)

const array = (value: unknown, path: string): readonly unknown[] =>
    Array.isArray(value) ? value : bad(path)

const finite = (value: unknown, path: string): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : bad(path)

const nullable = (value: unknown, path: string): number | null =>
    value === null || value === undefined ? null : finite(value, path)

const text = (value: unknown, path: string): string =>
    typeof value === 'string' ? value : bad(path)

const epochSeconds = (value: unknown, path: string): Instant =>
    instant(finite(value, path) * 1000)

const sameLength = (
    path: string,
    ...series: ReadonlyArray<readonly unknown[]>
): void => {
    if (new Set(series.map((s) => s.length)).size > 1) {
        bad(`${path} (series have different lengths)`)
    }
}

const sunWindows = (daily: Json): SunWindow[] => {
    const sunrise = array(daily.sunrise, 'daily.sunrise')
    const sunset = array(daily.sunset, 'daily.sunset')
    sameLength('daily sun times', sunrise, sunset)
    const windows: SunWindow[] = []
    sunrise.forEach((rise, i) => {
        // The sun may not rise or set at all (polar regions): no window then.
        if (typeof rise === 'number' && typeof sunset[i] === 'number') {
            windows.push({
                sunrise: epochSeconds(rise, `daily.sunrise[${i}]`),
                sunset: epochSeconds(sunset[i], `daily.sunset[${i}]`),
            })
        }
    })
    return windows
}

const measure = (value: unknown, unit: unknown, path: string): Measurement => ({
    value: nullable(value, path),
    unit: text(unit, `${path} unit`),
})

/** The value at the latest timestamp that is not after `at`. */
const valueAtOrBefore = (
    times: readonly unknown[],
    values: readonly unknown[],
    at: Instant,
    path: string
): number | null => {
    let bestTime = Number.NEGATIVE_INFINITY
    let bestIndex = -1
    times.forEach((time, i) => {
        const t = epochSeconds(time, `${path}.time[${i}]`)
        if (t <= at && t > bestTime) {
            bestTime = t
            bestIndex = i
        }
    })
    return bestIndex === -1
        ? null
        : nullable(values[bestIndex], `${path}[${bestIndex}]`)
}

export const mapCurrent = (raw: unknown): CurrentWeather => {
    const root = record(raw, 'response')
    const current = record(root.current_weather, 'current_weather')
    const currentUnits = record(
        root.current_weather_units,
        'current_weather_units'
    )
    const daily = record(root.daily, 'daily')
    const dailyUnits = record(root.daily_units, 'daily_units')
    const hourly = record(root.hourly, 'hourly')
    const hourlyUnits = record(root.hourly_units, 'hourly_units')

    const observedAt = epochSeconds(current.time, 'current_weather.time')
    const isDay = isDaylight(observedAt, sunWindows(daily))

    const apparentTimes = array(hourly.time, 'hourly.time')
    const apparent = array(
        hourly.apparent_temperature,
        'hourly.apparent_temperature'
    )
    sameLength('hourly', apparentTimes, apparent)

    const today = (key: string): unknown => array(daily[key], `daily.${key}`)[0]

    return {
        observedAt,
        temperature: measure(
            finite(current.temperature, 'current_weather.temperature'),
            currentUnits.temperature,
            'current_weather.temperature'
        ),
        apparentTemperature: measure(
            valueAtOrBefore(
                apparentTimes,
                apparent,
                observedAt,
                'hourly.apparent_temperature'
            ),
            hourlyUnits.apparent_temperature,
            'hourly.apparent_temperature'
        ),
        todayMin: measure(
            today('temperature_2m_min'),
            dailyUnits.temperature_2m_min,
            'daily.temperature_2m_min'
        ),
        todayMax: measure(
            today('temperature_2m_max'),
            dailyUnits.temperature_2m_max,
            'daily.temperature_2m_max'
        ),
        precipitationToday: measure(
            today('precipitation_sum'),
            dailyUnits.precipitation_sum,
            'daily.precipitation_sum'
        ),
        windSpeed: measure(
            finite(current.windspeed, 'current_weather.windspeed'),
            currentUnits.windspeed,
            'current_weather.windspeed'
        ),
        condition: makeCondition(
            finite(current.weathercode, 'current_weather.weathercode'),
            isDay
        ),
    }
}

export const mapHourly = (raw: unknown): HourlyEntry[] => {
    const root = record(raw, 'response')
    const hourly = record(root.hourly, 'hourly')
    const units = record(root.hourly_units, 'hourly_units')
    const windows = sunWindows(record(root.daily, 'daily'))

    const times = array(hourly.time, 'hourly.time')
    const temperatures = array(hourly.temperature_2m, 'hourly.temperature_2m')
    const windSpeeds = array(hourly.windspeed_10m, 'hourly.windspeed_10m')
    const precipitation = array(hourly.precipitation, 'hourly.precipitation')
    const codes = array(hourly.weathercode, 'hourly.weathercode')
    sameLength('hourly', times, temperatures, windSpeeds, precipitation, codes)

    return times.map((time, i) => {
        const at = epochSeconds(time, `hourly.time[${i}]`)
        return {
            at,
            temperature: measure(
                temperatures[i],
                units.temperature_2m,
                `hourly.temperature_2m[${i}]`
            ),
            precipitation: measure(
                precipitation[i],
                units.precipitation,
                `hourly.precipitation[${i}]`
            ),
            windSpeed: measure(
                windSpeeds[i],
                units.windspeed_10m,
                `hourly.windspeed_10m[${i}]`
            ),
            condition: makeCondition(
                finite(codes[i], `hourly.weathercode[${i}]`),
                isDaylight(at, windows)
            ),
        }
    })
}

export const mapDaily = (raw: unknown): DailyEntry[] => {
    const root = record(raw, 'response')
    const offsetSeconds = finite(root.utc_offset_seconds, 'utc_offset_seconds')
    const daily = record(root.daily, 'daily')
    const units = record(root.daily_units, 'daily_units')

    const times = array(daily.time, 'daily.time')
    const max = array(daily.temperature_2m_max, 'daily.temperature_2m_max')
    const min = array(daily.temperature_2m_min, 'daily.temperature_2m_min')
    const precipitation = array(
        daily.precipitation_sum,
        'daily.precipitation_sum'
    )
    const wind = array(daily.wind_speed_10m_max, 'daily.wind_speed_10m_max')
    const codes = array(daily.weathercode, 'daily.weathercode')
    sameLength('daily', times, max, min, precipitation, wind, codes)

    return times.map((time, i) => ({
        // local midnight as UTC seconds + the zone offset = the local date
        date: toPlainDate(
            instant((finite(time, `daily.time[${i}]`) + offsetSeconds) * 1000),
            'UTC'
        ),
        tempMax: measure(
            max[i],
            units.temperature_2m_max,
            `daily.temperature_2m_max[${i}]`
        ),
        tempMin: measure(
            min[i],
            units.temperature_2m_min,
            `daily.temperature_2m_min[${i}]`
        ),
        precipitationSum: measure(
            precipitation[i],
            units.precipitation_sum,
            `daily.precipitation_sum[${i}]`
        ),
        maxWindSpeed: measure(
            wind[i],
            units.wind_speed_10m_max,
            `daily.wind_speed_10m_max[${i}]`
        ),
        condition: makeCondition(
            finite(codes[i], `daily.weathercode[${i}]`),
            true
        ),
    }))
}
