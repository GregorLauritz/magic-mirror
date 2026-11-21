import { describe, expect, it, vi } from 'vitest'
import { createContainer } from '@/app/container'
import { FetchHttpClient } from '@/infrastructure/http/FetchHttpClient'
import { createTestConfig } from '../support/createTestConfig'
import { createTestContainer } from '../support/createTestContainer'
import { createTestQueryClient } from '../support/createTestQueryClient'
import { FakeWeatherProvider } from '../support/FakeWeatherProvider'
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
