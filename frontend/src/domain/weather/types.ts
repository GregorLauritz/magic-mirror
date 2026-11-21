import type { Measurement } from '@/domain/shared/Measurement'
import type { Instant, PlainDate } from '@/domain/shared/time'
import type { WeatherCondition } from './WeatherCondition'

export interface CurrentWeather {
    readonly observedAt: Instant
    readonly temperature: Measurement
    readonly apparentTemperature: Measurement
    readonly todayMin: Measurement
    readonly todayMax: Measurement
    readonly precipitationToday: Measurement
    readonly windSpeed: Measurement
    readonly condition: WeatherCondition
}

export interface HourlyEntry {
    /** Start of the hour. */
    readonly at: Instant
    readonly temperature: Measurement
    readonly precipitation: Measurement
    readonly windSpeed: Measurement
    readonly condition: WeatherCondition
}

export interface DailyEntry {
    /** The calendar day in the zone the forecast was requested for. */
    readonly date: PlainDate
    readonly tempMin: Measurement
    readonly tempMax: Measurement
    readonly precipitationSum: Measurement
    readonly maxWindSpeed: Measurement
    /** A daily summary has no single moment, so it always uses the day icon. */
    readonly condition: WeatherCondition
}
