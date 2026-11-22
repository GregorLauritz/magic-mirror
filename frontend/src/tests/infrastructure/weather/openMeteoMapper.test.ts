import { describe, expect, it } from 'vitest'
import { ProviderResponseError } from '@/application/ports/errors'
import {
    mapCurrent,
    mapDaily,
    mapHourly,
} from '@/infrastructure/weather/openMeteoMapper'
import {
    KOLKATA,
    TOKYO_MIDNIGHT,
    currentResponse,
    dailyResponse,
    hourlyResponse,
    unix,
} from '../../fixtures/openMeteo'

const ms = (iso: string) => Date.parse(iso)

describe('mapCurrent', () => {
    it("maps the observation, today's range and units", () => {
        const weather = mapCurrent(currentResponse())

        expect(weather.observedAt).toBe(ms('2024-01-15T03:00:00Z'))
        expect(weather.temperature).toEqual({ value: 6.5, unit: '°C' })
        expect(weather.todayMax).toEqual({ value: 9.1, unit: '°C' })
        expect(weather.todayMin).toEqual({ value: 1.2, unit: '°C' })
        expect(weather.precipitationToday).toEqual({ value: 0.4, unit: 'mm' })
        expect(weather.windSpeed).toEqual({ value: 11.2, unit: 'km/h' })
        expect(weather.condition).toEqual({
            code: 3,
            kind: 'overcast',
            isDay: true,
        })
    })

    it('is night when the observation is outside the sun window', () => {
        const weather = mapCurrent(
            currentResponse({
                current_weather: {
                    ...currentResponse().current_weather,
                    time: unix('2024-01-14T18:00:00Z'), // 03:00 in Tokyo
                },
            })
        )

        expect(weather.condition.isDay).toBe(false)
    })

    it('reads feels-like from the hourly entry matching the observation time', () => {
        // 12:00 in Tokyo is the 13th hourly entry (index 12): value 12 - 10 = 2
        expect(mapCurrent(currentResponse()).apparentTemperature).toEqual({
            value: 2,
            unit: '°C',
        })
    })

    it('matches by timestamp, not by local hour, in a half-hour zone (B3)', () => {
        // Kolkata is UTC+5:30, so hourly entries sit at xx:30 UTC. Observation
        // at 12:00 local = 06:30Z; the matching entry is the one at 06:30Z.
        const halfHourStart = unix('2024-01-14T18:30:00Z') // local midnight
        const response = currentResponse(
            {
                current_weather: {
                    ...currentResponse().current_weather,
                    time: unix('2024-01-15T06:30:00Z'),
                },
                hourly: {
                    time: Array.from(
                        { length: 24 },
                        (_, i) => halfHourStart + i * 3600
                    ),
                    apparent_temperature: Array.from(
                        { length: 24 },
                        (_, i) => 100 + i
                    ),
                },
                daily: {
                    ...currentResponse().daily,
                    time: [halfHourStart],
                    sunrise: [unix('2024-01-15T01:30:00Z')],
                    sunset: [unix('2024-01-15T12:00:00Z')],
                },
            },
            KOLKATA
        )

        expect(mapCurrent(response).apparentTemperature.value).toBe(112)
    })

    it('keeps a missing precipitation total as null rather than 0', () => {
        const response = currentResponse()
        const weather = mapCurrent({
            ...response,
            daily: { ...response.daily, precipitation_sum: [null] },
        })

        expect(weather.precipitationToday.value).toBeNull()
    })

    it.each([
        ['an empty object', {}],
        ['null', null],
        [
            'no current_weather block',
            { ...currentResponse(), current_weather: undefined },
        ],
        [
            'a non-numeric temperature',
            {
                ...currentResponse(),
                current_weather: {
                    ...currentResponse().current_weather,
                    temperature: 'warm',
                },
            },
        ],
        [
            'hourly arrays that do not line up',
            {
                ...currentResponse(),
                hourly: { time: [1, 2, 3], apparent_temperature: [1] },
            },
        ],
    ])('rejects %s with a ProviderResponseError', (_label, payload) => {
        expect(() => mapCurrent(payload)).toThrow(ProviderResponseError)
    })
})

describe('mapHourly (B3)', () => {
    it('returns the exact UTC instants regardless of the process time zone', () => {
        const entries = mapHourly(hourlyResponse())

        expect(entries).toHaveLength(48)
        expect(entries[0].at).toBe(ms('2024-01-14T15:00:00Z'))
        expect(entries[1].at - entries[0].at).toBe(3_600_000)
    })

    it('maps values and units per entry', () => {
        const entry = mapHourly(hourlyResponse())[5]

        expect(entry.temperature).toEqual({ value: 5, unit: '°C' })
        expect(entry.windSpeed).toEqual({ value: 105, unit: 'km/h' })
        expect(entry.precipitation).toEqual({ value: 0, unit: 'mm' })
        expect(entry.condition.code).toBe(1)
    })

    it("decides day or night per entry from that day's own sun window", () => {
        const entries = mapHourly(hourlyResponse())
        const jst = (localIso: string) =>
            entries.find((e) => e.at === ms(`${localIso}+09:00`))!

        expect(jst('2024-01-15T02:00:00').condition.isDay).toBe(false)
        expect(jst('2024-01-15T12:00:00').condition.isDay).toBe(true)
        expect(jst('2024-01-15T20:00:00').condition.isDay).toBe(false)
        // tomorrow's hours use tomorrow's window, not sunrise[0]/sunset[0]
        expect(jst('2024-01-16T02:00:00').condition.isDay).toBe(false)
        expect(jst('2024-01-16T12:00:00').condition.isDay).toBe(true)
    })

    it('keeps a null measurement (the forecast horizon can be incomplete)', () => {
        const response = hourlyResponse()
        const temperatures: Array<number | null> = [
            ...response.hourly.temperature_2m,
        ]
        temperatures[2] = null

        const entries = mapHourly({
            ...response,
            hourly: { ...response.hourly, temperature_2m: temperatures },
        })

        expect(entries[2].temperature.value).toBeNull()
    })

    it.each([
        ['an empty object', {}],
        ['a missing hourly block', { ...hourlyResponse(), hourly: undefined }],
        [
            'arrays of different lengths',
            {
                ...hourlyResponse(),
                hourly: { ...hourlyResponse().hourly, temperature_2m: [1, 2] },
            },
        ],
        [
            'a non-numeric timestamp',
            {
                ...hourlyResponse(),
                hourly: {
                    ...hourlyResponse().hourly,
                    time: ['2024-01-15T09:00'],
                },
            },
        ],
    ])('rejects %s with a ProviderResponseError', (_label, payload) => {
        expect(() => mapHourly(payload)).toThrow(ProviderResponseError)
    })
})

describe('mapDaily (B3)', () => {
    it('derives each date from the timestamp plus utc_offset_seconds', () => {
        // Tokyo midnight is the previous day in UTC; the offset puts it back
        expect(new Date(TOKYO_MIDNIGHT * 1000).toISOString().slice(0, 10)).toBe(
            '2024-01-14'
        )

        const entries = mapDaily(dailyResponse())

        expect(entries.map((e) => e.date)).toEqual([
            '2024-01-15',
            '2024-01-16',
            '2024-01-17',
            '2024-01-18',
            '2024-01-19',
        ])
    })

    it('maps the temperatures, precipitation, wind and units', () => {
        const entry = mapDaily(dailyResponse())[2]

        expect(entry.tempMax).toEqual({ value: 11, unit: '°C' })
        expect(entry.tempMin).toEqual({ value: 3, unit: '°C' })
        expect(entry.precipitationSum).toEqual({ value: 1, unit: 'mm' })
        expect(entry.maxWindSpeed).toEqual({ value: 7, unit: 'km/h' })
        expect(entry.condition).toEqual({ code: 61, kind: 'rain', isDay: true })
    })

    it('rejects a payload without daily data', () => {
        expect(() => mapDaily({})).toThrow(ProviderResponseError)
        expect(() =>
            mapDaily({ ...dailyResponse(), utc_offset_seconds: 'x' })
        ).toThrow(ProviderResponseError)
    })
})
