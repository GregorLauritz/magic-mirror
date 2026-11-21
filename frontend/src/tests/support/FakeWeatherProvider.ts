import type { WeatherProvider } from '@/application/ports/WeatherProvider'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { TimeZoneId } from '@/domain/shared/time'
import type {
    CurrentWeather,
    DailyEntry,
    HourlyEntry,
} from '@/domain/weather/types'

interface Script {
    current?: CurrentWeather | Error
    hourly?: readonly HourlyEntry[] | Error
    daily?: readonly DailyEntry[] | Error
}

export interface ProviderCall {
    readonly coordinates: Coordinates
    readonly timeZone: TimeZoneId
    readonly days?: number
}

/** Scripted WeatherProvider that records its calls. */
export class FakeWeatherProvider implements WeatherProvider {
    readonly currentCalls: ProviderCall[] = []
    readonly hourlyCalls: ProviderCall[] = []
    readonly dailyCalls: ProviderCall[] = []

    constructor(public script: Script = {}) {}

    async getCurrent(
        coordinates: Coordinates,
        timeZone: TimeZoneId
    ): Promise<CurrentWeather> {
        this.currentCalls.push({ coordinates, timeZone })
        return this.answer(this.script.current, 'current')
    }

    async getHourly(
        coordinates: Coordinates,
        timeZone: TimeZoneId
    ): Promise<readonly HourlyEntry[]> {
        this.hourlyCalls.push({ coordinates, timeZone })
        return this.answer(this.script.hourly, 'hourly')
    }

    async getDaily(
        coordinates: Coordinates,
        timeZone: TimeZoneId,
        days: number
    ): Promise<readonly DailyEntry[]> {
        this.dailyCalls.push({ coordinates, timeZone, days })
        return this.answer(this.script.daily, 'daily')
    }

    private answer<T>(value: T | Error | undefined, what: string): T {
        if (value === undefined)
            throw new Error(`Unscripted ${what} weather call`)
        if (value instanceof Error) throw value
        return value
    }
}
