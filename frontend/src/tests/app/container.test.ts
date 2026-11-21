import { describe, expect, it, vi } from 'vitest'
import { createContainer } from '@/app/container'
import { FetchHttpClient } from '@/infrastructure/http/FetchHttpClient'
import { createTestConfig } from '../support/createTestConfig'
import { createTestContainer } from '../support/createTestContainer'
import { createTestQueryClient } from '../support/createTestQueryClient'
import { FakeGeocodingProvider } from '../support/FakeGeocodingProvider'
import { FakeWeatherProvider } from '../support/FakeWeatherProvider'
import { InMemoryKeyValueStore } from '../support/InMemoryKeyValueStore'
import { FakeAppLifecycle } from '../support/FakeAppLifecycle'
import { FakeOAuthGateway } from '../support/FakeOAuthGateway'
import { FULL_RAW } from '../infrastructure/storage/legacyFixtures'
import { currentWeather } from '../support/weatherFixtures'
import { currentResponse } from '../fixtures/openMeteo'
import { FakeClock } from '../support/FakeClock'
import { FakeScheduler } from '../support/FakeScheduler'

describe('createContainer', () => {
    it('builds the production graph from the config alone', () => {
        const config = createTestConfig()

        const deps = createContainer(config)

        expect(deps.config).toBe(config)
        expect(deps.http).toBeInstanceOf(FetchHttpClient)
        expect(deps.queryClient).toBeDefined()
        expect(Math.abs(deps.clock.now() - Date.now())).toBeLessThan(1000)
        expect(typeof deps.clock.timeZone()).toBe('string')
    })

    it('uses the injected ports as they are', () => {
        const clock = new FakeClock()
        const scheduler = new FakeScheduler(clock)
        const queryClient = createTestQueryClient()
        const http = { getJson: vi.fn() }

        const deps = createContainer(createTestConfig(), {
            clock,
            scheduler,
            http,
            queryClient,
        })

        expect(deps.clock).toBe(clock)
        expect(deps.scheduler).toBe(scheduler)
        expect(deps.http).toBe(http)
        expect(deps.queryClient).toBe(queryClient)
    })

    it('builds a fresh, independent graph on every call', () => {
        const config = createTestConfig()

        const first = createContainer(config)
        const second = createContainer(config)

        expect(first.queryClient).not.toBe(second.queryClient)
        expect(first.http).not.toBe(second.http)
    })
})

describe('weather wiring', () => {
    it('builds the weather service over the Open-Meteo adapter and the configured base url', async () => {
        const { deps, http } = createTestContainer({
            config: { urls: { openMeteo: 'https://om.test/v1' } },
        })
        http.when('https://om.test/v1/forecast/').reply(currentResponse())

        const weather = await deps.weather.getCurrent({
            latitude: 1,
            longitude: 2,
        })

        expect(weather.condition.kind).toBe('overcast')
        expect(http.requests).toHaveLength(1)
    })

    it('uses an injected provider instead of the adapter', async () => {
        const provider = new FakeWeatherProvider({ current: currentWeather() })
        const { deps } = createTestContainer({ weatherProvider: provider })

        await deps.weather.getCurrent({ latitude: 1, longitude: 2 })

        expect(provider.currentCalls).toHaveLength(1)
    })
})

describe('location wiring', () => {
    it('reads the API key from the injected storage', () => {
        const localStore = new InMemoryKeyValueStore()
        localStore.set(
            'magic-mirror.api-keys',
            '{"geocodeApiKey":"from-storage"}'
        )

        const { deps } = createTestContainer({ localStore })

        expect(deps.apiKeys.getSnapshot()).toEqual({
            geocodeApiKey: 'from-storage',
        })
    })

    it('geocodes through the Maps.co adapter on the configured base url', async () => {
        const { deps, http } = createTestContainer({
            config: { urls: { geocode: 'https://geo.test' } },
        })
        http.when('https://geo.test/search').reply([
            { lat: '48.7', lon: '9.1', importance: 1 },
        ])

        const result = await deps.resolveCoordinates(
            { country: 'DE', city: 'Stuttgart', postalCode: '' },
            'KEY'
        )

        expect(result).toEqual({
            ok: true,
            value: { latitude: 48.7, longitude: 9.1 },
        })
    })

    it('uses an injected geocoding provider instead of the adapter', async () => {
        const geocoding = new FakeGeocodingProvider()
        const { deps } = createTestContainer({ geocodingProvider: geocoding })

        await deps.resolveCoordinates(
            { country: 'DE', city: 'X', postalCode: '' },
            'KEY'
        )

        expect(geocoding.calls).toHaveLength(1)
    })
})

describe('settings wiring', () => {
    it('loads the saved settings from the injected storage at startup', () => {
        const localStore = new InMemoryKeyValueStore()
        localStore.set('magic-mirror.user-settings', JSON.stringify(FULL_RAW))

        const { deps } = createTestContainer({ localStore })

        expect(deps.settings.getSnapshot().address?.city).toBe('Stuttgart')
    })

    it('saves through the container: it geocodes with the key, then persists', async () => {
        const geocoding = new FakeGeocodingProvider()
        const localStore = new InMemoryKeyValueStore()
        const { deps } = createTestContainer({
            localStore,
            geocodingProvider: geocoding,
        })

        const result = await deps.saveSettings({
            address: { country: 'DE', city: 'Stuttgart', postalCode: '70176' },
            eventsCalendarId: 'primary',
            birthdayCalendarId: 'primary',
            trainRoutes: [],
            trainDisplay: { mode: 'carousel', carouselIntervalSeconds: 15 },
            geocodeApiKey: 'k',
        })

        expect(result).toEqual({ ok: true, value: 'saved' })
        expect(
            JSON.parse(localStore.get('magic-mirror.user-settings')!).city
        ).toBe('Stuttgart')
        expect(
            JSON.parse(localStore.get('magic-mirror.api-keys')!).geocodeApiKey
        ).toBe('k')
    })

    it('resets all local data: both storages, the cache, the stores, then reloads', async () => {
        const localStore = new InMemoryKeyValueStore()
        const sessionStore = new InMemoryKeyValueStore()
        localStore.set('magic-mirror.user-settings', JSON.stringify(FULL_RAW))
        sessionStore.set('magic-mirror.google-token', '{}')
        const lifecycle = new FakeAppLifecycle()
        const { deps } = createTestContainer({
            localStore,
            sessionStore,
            lifecycle,
        })
        deps.queryClient.setQueryData(['google', 'x'], 1)

        await deps.resetLocalData()

        expect(localStore.keys()).toEqual([])
        expect(sessionStore.keys()).toEqual([])
        expect(deps.queryClient.getQueryData(['google', 'x'])).toBeUndefined()
        expect(deps.settings.getSnapshot().address).toBeUndefined()
        expect(lifecycle.reloads).toBe(1)
    })
})

describe('auth wiring', () => {
    it('starts signed in when the session storage holds a token', () => {
        const sessionStore = new InMemoryKeyValueStore()
        sessionStore.set(
            'magic-mirror.google-token',
            JSON.stringify({
                accessToken: 't',
                expiresAt: Date.now() + 3_600_000,
            })
        )

        const { deps } = createTestContainer({ sessionStore })

        expect(deps.auth.getSnapshot()).toEqual({ status: 'signed-in' })
    })

    it('stores a sign-in in the session storage (in the shape earlier versions used)', async () => {
        const gateway = new FakeOAuthGateway()
        const sessionStore = new InMemoryKeyValueStore()
        const { deps } = createTestContainer({
            oauthGateway: gateway,
            sessionStore,
        })

        const signIn = deps.auth.signIn()
        gateway.grant('abc', 3600)
        await signIn

        expect(
            JSON.parse(sessionStore.get('magic-mirror.google-token')!)
        ).toMatchObject({
            accessToken: 'abc',
        })
    })

    it('purges cached Google data on sign-out, and only that', async () => {
        const sessionStore = new InMemoryKeyValueStore()
        sessionStore.set(
            'magic-mirror.google-token',
            JSON.stringify({
                accessToken: 't',
                expiresAt: Date.now() + 3_600_000,
            })
        )
        const { deps } = createTestContainer({
            sessionStore,
            oauthGateway: new FakeOAuthGateway(),
        })
        deps.queryClient.setQueryData(['google', 'events'], ['private'])
        deps.queryClient.setQueryData(['weather', 'current'], 'public')

        await deps.auth.signOut()

        expect(
            deps.queryClient.getQueryData(['google', 'events'])
        ).toBeUndefined()
        expect(deps.queryClient.getQueryData(['weather', 'current'])).toBe(
            'public'
        )
    })

    it('warms up Google sign-in only when started, not while the graph is built', () => {
        const gateway = new FakeOAuthGateway()
        const { deps } = createTestContainer({ oauthGateway: gateway })
        expect(gateway.warmUps).toBe(0)

        deps.start()

        expect(gateway.warmUps).toBe(1)
    })

    it('revokes the Google token when all local data is cleared', async () => {
        const gateway = new FakeOAuthGateway()
        const sessionStore = new InMemoryKeyValueStore()
        sessionStore.set(
            'magic-mirror.google-token',
            JSON.stringify({
                accessToken: 'revoke-me',
                expiresAt: Date.now() + 3_600_000,
            })
        )
        const { deps } = createTestContainer({
            oauthGateway: gateway,
            sessionStore,
        })

        await deps.resetLocalData()

        expect(gateway.revoked).toEqual(['revoke-me'])
        expect(sessionStore.keys()).toEqual([])
    })
})

describe('createTestContainer', () => {
    it('wires the real graph over fakes and exposes them', () => {
        const { deps, clock, scheduler, http } = createTestContainer({
            now: '2030-06-01T08:00:00Z',
            timeZone: 'Asia/Tokyo',
        })

        expect(deps.clock).toBe(clock)
        expect(deps.scheduler).toBe(scheduler)
        expect(deps.http).toBe(http)
        expect(deps.clock.timeZone()).toBe('Asia/Tokyo')
        expect(new Date(deps.clock.now()).toISOString()).toBe(
            '2030-06-01T08:00:00.000Z'
        )
    })
})
