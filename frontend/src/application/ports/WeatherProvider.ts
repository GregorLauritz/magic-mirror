import type { Coordinates } from '@/domain/location/Coordinates'
import type { TimeZoneId } from '@/domain/shared/time'
import type {
    CurrentWeather,
    DailyEntry,
    HourlyEntry,
} from '@/domain/weather/types'

/**
 * Source of weather data. Implementations return fully resolved domain
 * objects (day/night already decided, dates already in the requested zone) and
 * reject with the HttpClient errors or ProviderResponseError.
 */
export interface WeatherProvider {
    getCurrent(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        signal?: AbortSignal
    ): Promise<CurrentWeather>

    /** About 48 hours starting at local midnight of today. */
    getHourly(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        signal?: AbortSignal
    ): Promise<readonly HourlyEntry[]>

    /** `days` calendar days starting with today. */
    getDaily(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        days: number,
        signal?: AbortSignal
    ): Promise<readonly DailyEntry[]>
}
