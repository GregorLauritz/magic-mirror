import { describe, expect, it } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useJourneys } from '@/features/trains/hooks/useJourneys'
import { useStationSearch } from '@/features/trains/hooks/useStationSearch'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeTrainProvider } from '../../support/FakeTrainProvider'
import { renderHookWithDeps } from '../../support/renderWithDeps'
import { journey } from '../../support/trainFixtures'

const settle = () => new Promise((resolve) => setTimeout(resolve, 20))
const JOURNEYS = [journey('2024-01-15T13:00:00Z')]

describe('useJourneys', () => {
    it('loads the next two journeys between the stations', async () => {
        const provider = new FakeTrainProvider({ journeys: JOURNEYS })
        const test = createTestContainer({ trainProvider: provider })

        const { result } = renderHookWithDeps(
            () => useJourneys('8000096', '8000105'),
            {
                deps: test.deps,
            }
        )

        await waitFor(() => expect(result.current.journeys).toEqual(JOURNEYS))
        expect(provider.journeyCalls).toEqual([
            { fromId: '8000096', toId: '8000105', limit: 2 },
        ])
    })

    it.each([
        ['', 'b'],
        ['a', ''],
        [undefined, 'b'],
        ['a', undefined],
    ])('does not ask without both stations (%j, %j)', async (from, to) => {
        const provider = new FakeTrainProvider({ journeys: JOURNEYS })
        const test = createTestContainer({ trainProvider: provider })

        const { result } = renderHookWithDeps(() => useJourneys(from, to), {
            deps: test.deps,
        })
        await settle()

        expect(provider.journeyCalls).toEqual([])
        expect(result.current.journeys).toBeUndefined()
    })

    it('reports a failure', async () => {
        const provider = new FakeTrainProvider({ journeys: new Error('boom') })
        const test = createTestContainer({ trainProvider: provider })

        const { result } = renderHookWithDeps(() => useJourneys('a', 'b'), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
    })

    it('keeps a route separate from another one', async () => {
        const provider = new FakeTrainProvider({ journeys: JOURNEYS })
        const test = createTestContainer({ trainProvider: provider })

        renderHookWithDeps(
            () => [useJourneys('a', 'b'), useJourneys('b', 'a')],
            {
                deps: test.deps,
            }
        )

        await waitFor(() => expect(provider.journeyCalls).toHaveLength(2))
    })
})

describe('useStationSearch', () => {
    const STATIONS = [{ id: '1', name: 'Berlin Hbf' }]
    // Starts empty, like the search field: what is typed arrives later.
    const setup = (
        provider = new FakeTrainProvider({ stations: STATIONS })
    ) => {
        const test = createTestContainer({ trainProvider: provider })
        const rendered = renderHookWithDeps(
            ({ query }) => useStationSearch(query),
            { deps: test.deps },
            { initialProps: { query: '' } }
        )
        return { ...rendered, test, provider }
    }

    it('asks after the typing pause, for ten stations', async () => {
        const { result, rerender, test, provider } = setup()

        rerender({ query: 'Be' })
        expect(provider.stationCalls).toEqual([])
        act(() => test.scheduler.advance(300))

        await waitFor(() => expect(result.current.stations).toEqual(STATIONS))
        expect(provider.stationCalls).toEqual([{ query: 'Be', limit: 10 }])
    })

    it('asks only for what was typed last while typing quickly', async () => {
        const { rerender, test, provider } = setup()
        rerender({ query: 'Be' })
        act(() => test.scheduler.advance(200))
        rerender({ query: 'Ber' })
        act(() => test.scheduler.advance(200))
        expect(provider.stationCalls).toEqual([])

        act(() => test.scheduler.advance(100))

        await waitFor(() =>
            expect(provider.stationCalls).toEqual([{ query: 'Ber', limit: 10 }])
        )
    })

    it.each(['B', ' B ', '   '])(
        'does not ask for %j (fewer than two characters)',
        async (query) => {
            const { result, rerender, test, provider } = setup()

            rerender({ query })
            act(() => test.scheduler.advance(300))
            await settle()

            expect(provider.stationCalls).toEqual([])
            expect(result.current.stations).toEqual([])
        }
    )

    it('searches for the trimmed text', async () => {
        const { rerender, test, provider } = setup()

        rerender({ query: '  Berlin ' })
        act(() => test.scheduler.advance(300))

        await waitFor(() =>
            expect(provider.stationCalls[0]?.query).toBe('Berlin')
        )
    })

    it('has no stations again when the text gets too short', async () => {
        const { result, rerender, test } = setup()
        rerender({ query: 'Be' })
        act(() => test.scheduler.advance(300))
        await waitFor(() => expect(result.current.stations).toEqual(STATIONS))

        rerender({ query: 'B' })
        act(() => test.scheduler.advance(300))

        await waitFor(() => expect(result.current.stations).toEqual([]))
    })

    it('reports a failure', async () => {
        const { result, rerender, test } = setup(
            new FakeTrainProvider({ stations: new Error('boom') })
        )

        rerender({ query: 'Be' })
        act(() => test.scheduler.advance(300))

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(result.current.stations).toEqual([])
    })
})
