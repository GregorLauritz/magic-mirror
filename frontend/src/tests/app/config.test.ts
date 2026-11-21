import { describe, expect, it } from 'vitest'
import { loadConfig } from '../../app/config'

describe('loadConfig', () => {
    it('returns the documented defaults for an empty environment', () => {
        const config = loadConfig({})

        expect(config.refreshIntervalMs).toBe(120_000)
        expect(config.staleTimeMs).toBe(60_000)
        expect(config.locale).toBe('en-US')
        expect(config.weatherIconZoom).toBe('4x')
        expect(config.weatherIconBaseUrl).toBe('https://openweathermap.org')
        expect(config.googleClientId).toMatch(/\.apps\.googleusercontent\.com$/)
        expect(config.docsUrl).toBe(
            'https://github.com/GregorLauritz/magic-mirror/blob/main/api-keys.md'
        )
        expect(config.urls).toEqual({
            openMeteo: 'https://api.open-meteo.com/v1',
            geocode: 'https://geocode.maps.co',
            trains: 'https://v6.db.transport.rest',
            googleCalendar: 'https://www.googleapis.com/calendar/v3',
        })
        expect(config.http).toEqual({ timeoutMs: 10_000, retries: 1 })
        expect(config.auth).toEqual({
            refreshMarginMs: 60_000,
            refreshCooldownMs: 300_000,
            interactiveTimeoutMs: 120_000,
            silentTimeoutMs: 15_000,
            loadTimeoutMs: 10_000,
        })
    })

    it('reads VITE_REFRESH_INTERVAL_MS', () => {
        expect(
            loadConfig({ VITE_REFRESH_INTERVAL_MS: '30000' }).refreshIntervalMs
        ).toBe(30_000)
    })

    it.each(['', 'abc', 'NaN', '-5', 'Infinity'])(
        'falls back to the default refresh interval for the invalid value %j',
        (value) => {
            expect(
                loadConfig({ VITE_REFRESH_INTERVAL_MS: value })
                    .refreshIntervalMs
            ).toBe(120_000)
        }
    )

    it('clamps a too-small refresh interval to the minimum of 10 seconds', () => {
        expect(
            loadConfig({ VITE_REFRESH_INTERVAL_MS: '500' }).refreshIntervalMs
        ).toBe(10_000)
    })

    it('ignores the legacy REACT_APP_* names, which Vite never exposed', () => {
        const config = loadConfig({
            REACT_APP_REFRESH_MILLIS: '30000',
            REACT_APP_WEATHER_ICON_ZOOM: '2x',
        })

        expect(config.refreshIntervalMs).toBe(120_000)
        expect(config.weatherIconZoom).toBe('4x')
    })

    it('accepts only the supported weather icon zoom values', () => {
        expect(
            loadConfig({ VITE_WEATHER_ICON_ZOOM: '2x' }).weatherIconZoom
        ).toBe('2x')
        expect(
            loadConfig({ VITE_WEATHER_ICON_ZOOM: '9x' }).weatherIconZoom
        ).toBe('4x')
    })

    it('reads string overrides and ignores blank ones', () => {
        expect(loadConfig({ VITE_LOCALE: 'de-DE' }).locale).toBe('de-DE')
        expect(loadConfig({ VITE_LOCALE: '  ' }).locale).toBe('en-US')
        expect(
            loadConfig({ VITE_GOOGLE_CLIENT_ID: 'abc.apps' }).googleClientId
        ).toBe('abc.apps')
        expect(
            loadConfig({ VITE_GOOGLE_CLIENT_ID: '' }).googleClientId
        ).toMatch(/\.apps\.googleusercontent\.com$/)
    })

    it('ignores non-string values (import.meta.env also carries booleans)', () => {
        expect(loadConfig({ VITE_LOCALE: true, DEV: true }).locale).toBe(
            'en-US'
        )
    })
})
