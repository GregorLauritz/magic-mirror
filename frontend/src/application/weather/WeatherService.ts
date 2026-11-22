import type { Clock } from '@/application/ports/Clock'
import type { WeatherProvider } from '@/application/ports/WeatherProvider'
import type { Coordinates } from '@/domain/location/Coordinates'
import { toPlainDate } from '@/domain/shared/time'
import { dailyAfterToday } from '@/domain/weather/forecastWindow'
import type {
    CurrentWeather,
    DailyEntry,
    HourlyEntry,
} from '@/domain/weather/types'

export interface WeatherService {
    getCurrent(
        coordinates: Coordinates,
        signal?: AbortSignal
    ): Promise<CurrentWeather>
    /** All hours the provider returned; the visible window is chosen at render time. */
    getHourly(
        coordinates: Coordinates,
        signal?: AbortSignal
    ): Promise<readonly HourlyEntry[]>
    /** The next `days` days after today. */
    getDaily(
        coordinates: Coordinates,
        days: number,
        signal?: AbortSignal
    ): Promise<readonly DailyEntry[]>
}

interface Dependencies {
    readonly provider: WeatherProvider
    readonly clock: Clock
}

/**
 * Binds the provider to the display time zone and decides what "the next days"
 * means: relative to today in that zone, not to the UTC date.
 */
export const createWeatherService = ({
    provider,
    clock,
}: Dependencies): WeatherService => ({
    getCurrent: (coordinates, signal) =>
        provider.getCurrent(coordinates, clock.timeZone(), signal),

    getHourly: (coordinates, signal) =>
        provider.getHourly(coordinates, clock.timeZone(), signal),

    getDaily: async (coordinates, days, signal) => {
        const timeZone = clock.timeZone()
        const today = toPlainDate(clock.now(), timeZone)
        // One extra day: the provider's list starts with today.
        const forecast = await provider.getDaily(
            coordinates,
            timeZone,
            days + 1,
            signal
        )
        return dailyAfterToday(forecast, today, days)
    },
})
