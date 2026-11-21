import { beforeEach, describe, expect, it } from 'vitest'
import { OpenMeteoWeatherProvider } from '@/infrastructure/weather/OpenMeteoWeatherProvider'
import { ProviderResponseError } from '@/application/ports/errors'
import { FakeHttpClient } from '../../support/FakeHttpClient'
import {
    currentResponse,
    dailyResponse,
    hourlyResponse,
} from '../../fixtures/openMeteo'

const BASE = 'https://api.open-meteo.test/v1'
const STUTTGART = { latitude: 48.7758, longitude: 9.1829 }

const paramsOf = (http: FakeHttpClient, index = 0) =>
    new URL(http.requests[index].url).searchParams

describe('OpenMeteoWeatherProvider', () => {
    let http: FakeHttpClient
    let provider: OpenMeteoWeatherProvider

    beforeEach(() => {
        http = new FakeHttpClient()
        provider = new OpenMeteoWeatherProvider(http, BASE)
    })

    describe('getCurrent', () => {
        beforeEach(() => {
            http.when('/forecast/').reply(currentResponse())
        })

        it('asks for unixtime, one forecast day and the display zone', async () => {
            await provider.getCurrent(STUTTGART, 'Europe/Berlin')

            const url = new URL(http.requests[0].url)
            const params = url.searchParams
            expect(`${url.origin}${url.pathname}`).toBe(`${BASE}/forecast/`)
            expect(params.get('latitude')).toBe('48.7758')
            expect(params.get('longitude')).toBe('9.1829')
            expect(params.get('current_weather')).toBe('true')
            expect(params.get('timeformat')).toBe('unixtime')
            expect(params.get('forecast_days')).toBe('1')
            expect(params.get('timezone')).toBe('Europe/Berlin')
            expect(params.get('hourly')).toBe('apparent_temperature')
            expect(params.get('daily')).toBe(
                'temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset'
            )
        })

        it('no longer sends start/end dates computed from the system clock (B3)', async () => {
            await provider.getCurrent(STUTTGART, 'Europe/Berlin')

            expect(paramsOf(http).has('start_date')).toBe(false)
            expect(paramsOf(http).has('end_date')).toBe(false)
        })

        it('maps the response to the domain model and forwards the abort signal', async () => {
            const controller = new AbortController()

            const weather = await provider.getCurrent(
                STUTTGART,
                'Europe/Berlin',
                controller.signal
            )

            expect(weather.condition.kind).toBe('overcast')
            expect(http.requests[0].signal).toBe(controller.signal)
        })
    })

    describe('getHourly', () => {
        beforeEach(() => {
            http.when('/forecast/').reply(hourlyResponse())
        })

        it('requests the display zone, not UTC, for two forecast days (B3)', async () => {
            await provider.getHourly(STUTTGART, 'Europe/Berlin')

            const params = paramsOf(http)
            expect(params.get('timezone')).toBe('Europe/Berlin')
            expect(params.get('timeformat')).toBe('unixtime')
            expect(params.get('forecast_days')).toBe('2')
            expect(params.get('hourly')).toBe(
                'temperature_2m,windspeed_10m,precipitation,weathercode'
            )
            expect(params.get('daily')).toBe('sunrise,sunset')
            expect(params.has('start_date')).toBe(false)
        })

        it('returns the mapped entries', async () => {
            const entries = await provider.getHourly(STUTTGART, 'Asia/Tokyo')

            expect(entries).toHaveLength(48)
        })
    })

    describe('getDaily', () => {
        beforeEach(() => {
            http.when('/forecast/').reply(dailyResponse())
        })

        it('requests exactly the number of days asked for, in the display zone', async () => {
            await provider.getDaily(STUTTGART, 'Europe/Berlin', 5)

            const params = paramsOf(http)
            expect(params.get('forecast_days')).toBe('5')
            expect(params.get('timezone')).toBe('Europe/Berlin')
            expect(params.get('timeformat')).toBe('unixtime')
            expect(params.get('daily')).toBe(
                'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,weathercode,sunrise,sunset,wind_speed_10m_max'
            )
            expect(params.has('start_date')).toBe(false)
        })

        it('returns the mapped entries, today included', async () => {
            const entries = await provider.getDaily(STUTTGART, 'Asia/Tokyo', 5)

            expect(entries).toHaveLength(5)
            expect(entries[0].date).toBe('2024-01-15')
        })
    })

    it('turns a malformed payload into a ProviderResponseError', async () => {
        http.when('/forecast/').reply({ unexpected: true })

        await expect(
            provider.getCurrent(STUTTGART, 'UTC')
        ).rejects.toBeInstanceOf(ProviderResponseError)
    })

    it('lets transport failures through untouched', async () => {
        const failure = new Error('offline')
        http.when('/forecast/').reply(failure)

        await expect(provider.getHourly(STUTTGART, 'UTC')).rejects.toBe(failure)
    })
})
