import { describe, expect, it } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useCurrentWeather } from '@/features/weather/hooks/useCurrentWeather'
import { useDailyForecast } from '@/features/weather/hooks/useDailyForecast'
import { useHourlyForecast } from '@/features/weather/hooks/useHourlyForecast'
import {
    createTestContainer,
    type TestContainerOptions,
} from '../../support/createTestContainer'
import { FakeWeatherProvider } from '../../support/FakeWeatherProvider'
import { renderHookWithDeps } from '../../support/renderWithDeps'
import {
    currentWeather,
    dailyEntries,
    hourlyEntries,
} from '../../support/weatherFixtures'

const COORDS = { latitude: 48.7758, longitude: 9.1829 }

const setup = (
    provider: FakeWeatherProvider,
    options: TestContainerOptions = {}
) => createTestContainer({ weatherProvider: provider, ...options })

const hoursOf = (entries: ReadonlyArray<{ at: number }> | undefined) =>
    entries?.map((e) => new Date(e.at).getUTCHours())

describe('useCurrentWeather', () => {
    it('fetches the current weather for the coordinates and the display zone', async () => {
        const provider = new FakeWeatherProvider({ current: currentWeather() })
        const test = setup(provider, { timeZone: 'Europe/Berlin' })

        const { result } = renderHookWithDeps(() => useCurrentWeather(COORDS), {
            deps: test.deps,
        })

        await waitFor(() =>
            expect(result.current.data).toEqual(currentWeather())
        )
        expect(provider.currentCalls).toEqual([
            { coordinates: COORDS, timeZone: 'Europe/Berlin' },
        ])
    })

    it('reports a provider failure as an error', async () => {
        const provider = new FakeWeatherProvider({ current: new Error('boom') })
        const test = setup(provider)

        const { result } = renderHookWithDeps(() => useCurrentWeather(COORDS), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
    })
})

describe('useHourlyForecast', () => {
    const provider = () =>
        new FakeWeatherProvider({
            hourly: hourlyEntries('2024-01-15T09:00:00Z', 10),
        })

    it('returns only the upcoming hours, five of them', async () => {
        const test = setup(provider(), {
            now: '2024-01-15T10:20:00Z',
            timeZone: 'UTC',
        })

        const { result } = renderHookWithDeps(() => useHourlyForecast(COORDS), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.entries).toBeDefined())
        expect(hoursOf(result.current.entries)).toEqual([11, 12, 13, 14, 15])
    })

    it('asks for the display zone of the clock, not UTC (B3)', async () => {
        const fake = provider()
        const test = setup(fake, {
            now: '2024-01-15T10:20:00Z',
            timeZone: 'Asia/Tokyo',
        })

        const { result } = renderHookWithDeps(() => useHourlyForecast(COORDS), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.entries).toBeDefined())
        expect(fake.hourlyCalls[0].timeZone).toBe('Asia/Tokyo')
    })

    it('does not refetch or change the window on a plain minute tick', async () => {
        const fake = provider()
        const test = setup(fake, {
            now: '2024-01-15T10:20:30Z',
            timeZone: 'UTC',
        })
        const { result } = renderHookWithDeps(() => useHourlyForecast(COORDS), {
            deps: test.deps,
        })
        await waitFor(() => expect(result.current.entries).toBeDefined())
        const before = hoursOf(result.current.entries)

        act(() => test.scheduler.advance(60_000)) // 10:21:30, same hour

        expect(hoursOf(result.current.entries)).toEqual(before)
        expect(fake.hourlyCalls).toHaveLength(1)
    })

    it('moves the window forward when the hour turns', async () => {
        const fake = provider()
        const test = setup(fake, {
            now: '2024-01-15T10:59:30Z',
            timeZone: 'UTC',
        })
        const { result } = renderHookWithDeps(() => useHourlyForecast(COORDS), {
            deps: test.deps,
        })
        await waitFor(() => expect(result.current.entries).toBeDefined())
        expect(hoursOf(result.current.entries)).toEqual([11, 12, 13, 14, 15])

        act(() => test.scheduler.advance(60_000)) // 11:00:30: 11:00 has started

        expect(hoursOf(result.current.entries)).toEqual([12, 13, 14, 15, 16])
    })

    it('refetches when the hour changes', async () => {
        const fake = provider()
        const test = setup(fake, {
            now: '2024-01-15T10:59:30Z',
            timeZone: 'UTC',
        })
        const { result } = renderHookWithDeps(() => useHourlyForecast(COORDS), {
            deps: test.deps,
        })
        await waitFor(() => expect(fake.hourlyCalls).toHaveLength(1))

        act(() => test.scheduler.advance(60_000)) // 11:00:30

        await waitFor(() => expect(fake.hourlyCalls).toHaveLength(2))
        expect(result.current.isError).toBe(false)
    })

    it('reports a provider failure', async () => {
        const test = setup(
            new FakeWeatherProvider({ hourly: new Error('boom') })
        )

        const { result } = renderHookWithDeps(() => useHourlyForecast(COORDS), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(result.current.entries).toBeUndefined()
    })
})

describe('useDailyForecast', () => {
    it('returns the four days after today and asks the provider for five', async () => {
        const fake = new FakeWeatherProvider({
            daily: dailyEntries('2024-01-15', 5),
        })
        const test = setup(fake, {
            now: '2024-01-15T12:00:00Z',
            timeZone: 'UTC',
        })

        const { result } = renderHookWithDeps(() => useDailyForecast(COORDS), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.days).toBeDefined())
        expect(result.current.days?.map((d) => d.date)).toEqual([
            '2024-01-16',
            '2024-01-17',
            '2024-01-18',
            '2024-01-19',
        ])
        expect(fake.dailyCalls[0].days).toBe(5)
    })

    it('refetches when the local day changes', async () => {
        const fake = new FakeWeatherProvider({
            daily: dailyEntries('2024-01-15', 5),
        })
        const test = setup(fake, {
            now: '2024-01-15T23:59:30Z',
            timeZone: 'UTC',
        })
        renderHookWithDeps(() => useDailyForecast(COORDS), { deps: test.deps })
        await waitFor(() => expect(fake.dailyCalls).toHaveLength(1))

        act(() => test.scheduler.advance(60_000)) // 00:00:30 on the 16th

        await waitFor(() => expect(fake.dailyCalls).toHaveLength(2))
    })
})
