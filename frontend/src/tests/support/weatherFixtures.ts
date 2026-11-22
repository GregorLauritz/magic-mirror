import { instant, plainDate } from '@/domain/shared/time'
import { makeCondition } from '@/domain/weather/WeatherCondition'
import type {
    CurrentWeather,
    DailyEntry,
    HourlyEntry,
} from '@/domain/weather/types'

const at = (iso: string) => instant(Date.parse(iso))

export const currentWeather = (
    overrides: Partial<CurrentWeather> = {}
): CurrentWeather => ({
    observedAt: at('2024-01-15T03:00:00Z'),
    temperature: { value: 6.5, unit: '°C' },
    apparentTemperature: { value: 2, unit: '°C' },
    todayMin: { value: 1.2, unit: '°C' },
    todayMax: { value: 9.1, unit: '°C' },
    precipitationToday: { value: 0.4, unit: 'mm' },
    windSpeed: { value: 11.2, unit: 'km/h' },
    condition: makeCondition(3, true),
    ...overrides,
})

/** One entry per hour starting at `startIso`; temperature is the index. */
export const hourlyEntries = (startIso: string, count: number): HourlyEntry[] =>
    Array.from({ length: count }, (_, i) => ({
        at: instant(Date.parse(startIso) + i * 3_600_000),
        temperature: { value: i + 0.4, unit: '°C' },
        precipitation: { value: 0, unit: 'mm' },
        windSpeed: { value: 100 + i, unit: 'km/h' },
        condition: makeCondition(1, true),
    }))

/** One entry per day starting at `startDate` (YYYY-MM-DD, UTC arithmetic). */
export const dailyEntries = (startDate: string, count: number): DailyEntry[] =>
    Array.from({ length: count }, (_, i) => ({
        date: plainDate(
            new Date(Date.parse(`${startDate}T00:00:00Z`) + i * 86_400_000)
                .toISOString()
                .slice(0, 10)
        ),
        tempMin: { value: i, unit: '°C' },
        tempMax: { value: i + 8, unit: '°C' },
        precipitationSum: { value: i / 2, unit: 'mm' },
        maxWindSpeed: { value: 5 + i, unit: 'km/h' },
        condition: makeCondition(61, true),
    }))
