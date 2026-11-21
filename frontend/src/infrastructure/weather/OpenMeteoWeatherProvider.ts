import type { HttpClient } from '@/application/ports/HttpClient'
import type { WeatherProvider } from '@/application/ports/WeatherProvider'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { TimeZoneId } from '@/domain/shared/time'
import type {
    CurrentWeather,
    DailyEntry,
    HourlyEntry,
} from '@/domain/weather/types'
import { mapCurrent, mapDaily, mapHourly } from './openMeteoMapper'

const CURRENT_DAILY =
    'temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset'
const HOURLY = 'temperature_2m,windspeed_10m,precipitation,weathercode'
const DAILY =
    'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,weathercode,sunrise,sunset,wind_speed_10m_max'

/**
 * Open-Meteo (keyless) adapter. Requests use `timeformat=unixtime`,
 * `forecast_days` and the display time zone, so the server decides what
 * "today" is and nothing depends on the browser's clock or zone.
 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
    constructor(
        private readonly http: HttpClient,
        private readonly baseUrl: string
    ) {}

    async getCurrent(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        signal?: AbortSignal
    ): Promise<CurrentWeather> {
        const url = this.url(coordinates, timeZone, {
            current_weather: 'true',
            daily: CURRENT_DAILY,
            hourly: 'apparent_temperature',
            forecast_days: '1',
        })
        return mapCurrent(await this.http.getJson({ url, signal }))
    }

    async getHourly(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        signal?: AbortSignal
    ): Promise<readonly HourlyEntry[]> {
        const url = this.url(coordinates, timeZone, {
            hourly: HOURLY,
            daily: 'sunrise,sunset',
            forecast_days: '2',
        })
        return mapHourly(await this.http.getJson({ url, signal }))
    }

    async getDaily(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        days: number,
        signal?: AbortSignal
    ): Promise<readonly DailyEntry[]> {
        const url = this.url(coordinates, timeZone, {
            daily: DAILY,
            forecast_days: String(days),
        })
        return mapDaily(await this.http.getJson({ url, signal }))
    }

    private url(
        { latitude, longitude }: Coordinates,
        timeZone: TimeZoneId,
        extra: Record<string, string>
    ): string {
        const params = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            timezone: timeZone,
            timeformat: 'unixtime',
            ...extra,
        })
        return `${this.baseUrl}/forecast/?${params.toString()}`
    }
}
