import { describe, expect, it } from 'vitest'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { TrainTimesWidget } from '@/features/trains/TrainTimesWidget'
import type { Journey } from '@/domain/trains/types'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import {
    createTestContainer,
    type TestContainerOptions,
} from '../../support/createTestContainer'
import { FakeTrainProvider } from '../../support/FakeTrainProvider'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderWithDeps } from '../../support/renderWithDeps'
import { journey, leg } from '../../support/trainFixtures'

const route = (id: string, from: string, to: string) => ({
    id,
    departure_station_id: `${id}-from`,
    departure_station_name: from,
    arrival_station_id: `${id}-to`,
    arrival_station_name: to,
})

const ROUTES = [
    route('r1', 'Stuttgart Hbf', 'Frankfurt Hbf'),
    route('r2', 'Ulm Hbf', 'Munich Hbf'),
]

const render = (
    provider: FakeTrainProvider,
    {
        routes = ROUTES,
        display = { mode: 'multiple', carousel_interval: 15 },
        ...options
    }: TestContainerOptions & {
        routes?: ReturnType<typeof route>[]
        display?: { mode: string; carousel_interval: number }
    } = {}
) => {
    const store = new InMemoryKeyValueStore()
    store.set(
        STORAGE_KEYS.userSettings,
        JSON.stringify({
            train_connections: routes,
            train_display_settings: display,
        })
    )
    const test = createTestContainer({
        trainProvider: provider,
        localStore: store,
        now: '2024-01-15T09:00:00Z',
        timeZone: 'UTC',
        ...options,
    })
    return {
        ...renderWithDeps(<TrainTimesWidget />, { deps: test.deps }),
        test,
    }
}

const withJourneys = (...journeys: Journey[]) =>
    new FakeTrainProvider({ journeys })
const DEPARTS = '2024-01-15T09:05:00Z'

describe('TrainTimesWidget', () => {
    it('asks the user to add connections when there are none', () => {
        render(withJourneys(), { routes: [] })

        expect(
            screen.getByText(
                'No train connections configured. Please add them in the settings'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Settings' })
        ).toBeInTheDocument()
    })

    describe('multiple mode', () => {
        it('shows one card per connection and asks for each', async () => {
            const provider = withJourneys(journey(DEPARTS))

            render(provider)

            expect(await screen.findAllByText('Train Times')).toHaveLength(2)
            expect(
                screen.getByText('Stuttgart Hbf → Frankfurt Hbf')
            ).toBeInTheDocument()
            expect(screen.getByText('Ulm Hbf → Munich Hbf')).toBeInTheDocument()
            await screen.findAllByText('09:05 → 10:05')
            expect(provider.journeyCalls.map((c) => c.fromId).sort()).toEqual([
                'r1-from',
                'r2-from',
            ])
        })

        it('shows no carousel controls', async () => {
            render(withJourneys(journey(DEPARTS)))
            await screen.findAllByText('09:05 → 10:05')

            expect(
                screen.queryByRole('button', { name: 'Next connection' })
            ).not.toBeInTheDocument()
        })
    })

    describe('one connection', () => {
        const single = [ROUTES[0]]

        it('shows at most the two next journeys: times in the display zone, lines and duration', async () => {
            render(
                withJourneys(
                    journey(DEPARTS, {
                        legs: [leg({ line: 'RE 5' }), leg({ line: 'ICE 71' })],
                        durationMinutes: 107,
                    }),
                    journey('2024-01-15T09:35:00Z'),
                    journey('2024-01-15T10:05:00Z')
                ),
                { routes: single }
            )

            expect(await screen.findByText('09:05 → 10:52')).toBeInTheDocument()
            expect(
                screen.getByText('RE 5 → ICE 71 • 1h 47m')
            ).toBeInTheDocument()
            expect(screen.getByText('09:35 → 10:35')).toBeInTheDocument()
            expect(screen.queryByText('10:05 → 11:05')).not.toBeInTheDocument()
        })

        it('formats the times in the display zone, not in the browser zone', async () => {
            render(withJourneys(journey(DEPARTS)), {
                routes: single,
                timeZone: 'Asia/Tokyo',
            })

            expect(await screen.findByText('18:05 → 19:05')).toBeInTheDocument()
        })

        it('shows the platform and the delay in minutes (the delay is stored in seconds)', async () => {
            render(
                withJourneys(
                    journey(DEPARTS, {
                        departurePlatform: '9',
                        delaySeconds: 300,
                    })
                ),
                { routes: single }
            )

            expect(await screen.findByText('Platform 9')).toBeInTheDocument()
            expect(screen.getByText('+5 min')).toBeInTheDocument()
        })

        it('shows no delay for an on-time or early train', async () => {
            render(withJourneys(journey(DEPARTS, { delaySeconds: -60 })), {
                routes: single,
            })

            await screen.findByText('09:05 → 10:05')
            expect(screen.queryByText(/min$/)).not.toBeInTheDocument()
        })

        it('shows a cancelled train as cancelled, without platform and delay', async () => {
            render(
                withJourneys(
                    journey(DEPARTS, {
                        legs: [leg({ cancelled: true })],
                        departurePlatform: '9',
                        delaySeconds: 300,
                    })
                ),
                { routes: single }
            )

            expect(await screen.findByText('Cancelled')).toBeInTheDocument()
            expect(screen.queryByText('Platform 9')).not.toBeInTheDocument()
            expect(screen.queryByText('+5 min')).not.toBeInTheDocument()
        })

        it('says so when there is no connection', async () => {
            render(withJourneys(), { routes: single })

            expect(
                await screen.findByText('No connections found')
            ).toBeInTheDocument()
        })

        it('shows an error message when the connections cannot be loaded', async () => {
            render(new FakeTrainProvider({ journeys: new Error('boom') }), {
                routes: single,
            })

            expect(
                await screen.findByText('Error loading train connections')
            ).toBeInTheDocument()
        })

        it('shows placeholders while loading', () => {
            const { container } = render(withJourneys(journey(DEPARTS)), {
                routes: single,
            })

            expect(
                container.querySelectorAll('.MuiSkeleton-root').length
            ).toBeGreaterThan(0)
        })
    })

    describe('carousel mode', () => {
        const carousel = { mode: 'carousel', carousel_interval: 15 }

        it('shows the first connection with its position and controls', async () => {
            render(withJourneys(journey(DEPARTS)), { display: carousel })

            expect(
                await screen.findByText('Stuttgart Hbf → Frankfurt Hbf')
            ).toBeInTheDocument()
            expect(
                screen.queryByText('Ulm Hbf → Munich Hbf')
            ).not.toBeInTheDocument()
            expect(screen.getByText('1/2')).toBeInTheDocument()
        })

        it('moves on by hand, in both directions, wrapping around', async () => {
            render(withJourneys(journey(DEPARTS)), { display: carousel })
            await screen.findByText('Stuttgart Hbf → Frankfurt Hbf')

            fireEvent.click(
                screen.getByRole('button', { name: 'Next connection' })
            )
            expect(
                await screen.findByText('Ulm Hbf → Munich Hbf')
            ).toBeInTheDocument()
            expect(screen.getByText('2/2')).toBeInTheDocument()

            fireEvent.click(
                screen.getByRole('button', { name: 'Previous connection' })
            )
            fireEvent.click(
                screen.getByRole('button', { name: 'Previous connection' })
            )
            expect(
                await screen.findByText('Ulm Hbf → Munich Hbf')
            ).toBeInTheDocument()
        })

        it('moves on by itself after the interval', async () => {
            const { test } = render(withJourneys(journey(DEPARTS)), {
                display: carousel,
            })
            await screen.findByText('Stuttgart Hbf → Frankfurt Hbf')

            act(() => test.scheduler.advance(15_000))

            expect(
                await screen.findByText('Ulm Hbf → Munich Hbf')
            ).toBeInTheDocument()
        })

        it('shows no controls for a single connection', async () => {
            render(withJourneys(journey(DEPARTS)), {
                display: carousel,
                routes: [ROUTES[0]],
            })
            await screen.findByText('Stuttgart Hbf → Frankfurt Hbf')

            expect(
                screen.queryByRole('button', { name: 'Next connection' })
            ).not.toBeInTheDocument()
            expect(screen.queryByText('1/1')).not.toBeInTheDocument()
        })

        it('keeps the heading and the controls together in the header', async () => {
            render(withJourneys(journey(DEPARTS)), { display: carousel })
            const heading = await screen.findByText('Train Times')

            expect(
                within(heading.parentElement as HTMLElement).getByRole(
                    'button',
                    { name: 'Next connection' }
                )
            ).toBeInTheDocument()
        })
    })
})
