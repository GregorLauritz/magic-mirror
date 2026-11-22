import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { BirthdaysWidget } from '@/features/calendar/BirthdaysWidget'
import { UpcomingEventsWidget } from '@/features/calendar/UpcomingEventsWidget'
import { plainDate } from '@/domain/shared/time'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import {
    createTestContainer,
    type TestContainerOptions,
} from '../../support/createTestContainer'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { FakeCalendarProvider } from '../../support/FakeCalendarProvider'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderWithDeps } from '../../support/renderWithDeps'
import { allDayEvent, timedEvent } from '../../support/calendarFixtures'
import type { AuthState } from '@/domain/auth/AuthToken'

const render = (
    ui: React.ReactElement,
    provider: FakeCalendarProvider,
    {
        auth = { status: 'signed-in' } as AuthState,
        settings = { events_cal_id: 'cal', birthday_cal_id: 'bday' } as Record<
            string,
            string
        >,
        ...options
    }: TestContainerOptions & {
        auth?: AuthState
        settings?: Record<string, string>
    } = {}
) => {
    const store = new InMemoryKeyValueStore()
    store.set(STORAGE_KEYS.userSettings, JSON.stringify(settings))
    const test = createTestContainer({
        calendarProvider: provider,
        authSession: new FakeAuthSession(auth),
        localStore: store,
        now: '2024-01-15T12:00:00Z',
        timeZone: 'UTC',
        ...options,
    })
    return { ...renderWithDeps(ui, { deps: test.deps }), test }
}

const column = (title: string) => {
    const heading = screen.getByText(title)
    return within(heading.parentElement as HTMLElement)
}

describe('UpcomingEventsWidget', () => {
    it('groups the events under TODAY, TOMORROW and OVERMORROW', async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({
                events: [
                    timedEvent(
                        'Standup',
                        '2024-01-15T13:00:00Z',
                        '2024-01-15T13:30:00Z',
                        'Room 1'
                    ),
                    timedEvent(
                        'Dentist',
                        '2024-01-16T09:00:00Z',
                        '2024-01-16T10:00:00Z'
                    ),
                    allDayEvent('Holiday', '2024-01-17', '2024-01-18'),
                ],
            })
        )

        expect(await screen.findByText('Standup')).toBeInTheDocument()
        expect(column('TODAY').getByText('Standup')).toBeInTheDocument()
        expect(column('TODAY').getByText('13:00-13:30')).toBeInTheDocument()
        expect(column('TODAY').getByText('Room 1')).toBeInTheDocument()
        expect(column('TOMORROW').getByText('Dentist')).toBeInTheDocument()
        expect(column('OVERMORROW').getByText('Holiday')).toBeInTheDocument()
        expect(column('OVERMORROW').getByText('All day')).toBeInTheDocument()
    })

    it("hides today's events that are already over", async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({
                events: [
                    timedEvent(
                        'Breakfast',
                        '2024-01-15T07:00:00Z',
                        '2024-01-15T08:00:00Z'
                    ),
                    timedEvent(
                        'Lunch',
                        '2024-01-15T12:30:00Z',
                        '2024-01-15T13:30:00Z'
                    ),
                ],
            })
        )

        expect(await screen.findByText('Lunch')).toBeInTheDocument()
        expect(screen.queryByText('Breakfast')).not.toBeInTheDocument()
    })

    it('shows the empty-day texts', async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({ events: [] })
        )

        expect(
            await screen.findByText('No more events today')
        ).toBeInTheDocument()
        expect(screen.getAllByText('No events')).toHaveLength(2)
    })

    it('summarises overflowing days: "N more events" for today (2 shown max), "N events" for the next days (1 max)', async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({
                events: [
                    timedEvent(
                        'T1',
                        '2024-01-15T13:00:00Z',
                        '2024-01-15T14:00:00Z'
                    ),
                    timedEvent(
                        'T2',
                        '2024-01-15T15:00:00Z',
                        '2024-01-15T16:00:00Z'
                    ),
                    timedEvent(
                        'T3',
                        '2024-01-15T17:00:00Z',
                        '2024-01-15T18:00:00Z'
                    ),
                    timedEvent(
                        'M1',
                        '2024-01-16T08:00:00Z',
                        '2024-01-16T09:00:00Z'
                    ),
                    timedEvent(
                        'M2',
                        '2024-01-16T10:00:00Z',
                        '2024-01-16T11:00:00Z'
                    ),
                ],
            })
        )

        expect(await screen.findByText('T1')).toBeInTheDocument()
        expect(screen.queryByText('T2')).not.toBeInTheDocument()
        // today: T1 stays, T2 and T3 are summarised with the span they cover
        expect(column('TODAY').getByText('2 more events')).toBeInTheDocument()
        expect(column('TODAY').getByText('15:00-18:00')).toBeInTheDocument()
        // tomorrow has room for one line only, so both events are summarised
        expect(column('TOMORROW').getByText('2 events')).toBeInTheDocument()
        expect(column('TOMORROW').getByText('08:00-11:00')).toBeInTheDocument()
        expect(screen.queryByText('M1')).not.toBeInTheDocument()
    })

    it('shows multi-day all-day events with their progress', async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({
                events: [allDayEvent('Trip', '2024-01-15', '2024-01-18')],
            })
        )

        expect(
            await screen.findByText('Jan 15-Jan 17 (1/3)')
        ).toBeInTheDocument()
        expect(screen.getByText('Jan 15-Jan 17 (2/3)')).toBeInTheDocument()
        expect(screen.getByText('Jan 15-Jan 17 (3/3)')).toBeInTheDocument()
    })

    it('shows the days in the display zone', async () => {
        // 22:00Z on the 15th is already 07:00 on the 16th in Tokyo: tomorrow, not today
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({
                events: [
                    timedEvent(
                        'Early',
                        '2024-01-15T22:00:00Z',
                        '2024-01-15T23:00:00Z'
                    ),
                ],
            }),
            { timeZone: 'Asia/Tokyo' }
        )

        expect(await screen.findByText('Early')).toBeInTheDocument()
        expect(column('TOMORROW').getByText('Early')).toBeInTheDocument()
        expect(column('TOMORROW').getByText('07:00-08:00')).toBeInTheDocument()
    })

    it('asks the user to sign in, without calling Google', () => {
        const provider = new FakeCalendarProvider({ events: [] })

        render(<UpcomingEventsWidget />, provider, {
            auth: { status: 'signed-out' },
        })

        expect(
            screen.getByText('Sign in with Google in Settings')
        ).toBeInTheDocument()
        expect(provider.eventCalls).toEqual([])
    })

    it('asks the user to sign in again when the renewal failed and there is nothing to show', async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({ events: new Error('auth') }),
            {
                auth: { status: 'needs-reauth', reason: 'popup_closed' },
            }
        )

        expect(
            await screen.findByText(
                'Google sign-in expired. Sign in again in Settings'
            )
        ).toBeInTheDocument()
    })

    it('shows placeholders while loading', () => {
        const { container } = render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({ events: [] })
        )

        expect(
            container.querySelectorAll('.MuiSkeleton-root').length
        ).toBeGreaterThan(0)
    })

    it('shows an error message when the events cannot be loaded', async () => {
        render(
            <UpcomingEventsWidget />,
            new FakeCalendarProvider({ events: new Error('boom') })
        )

        expect(
            await screen.findByText('Error while loading events')
        ).toBeInTheDocument()
    })
})

describe('BirthdaysWidget', () => {
    const birthdays = (...entries: Array<[string, string]>) =>
        entries.map(([name, date]) => ({ name, date: plainDate(date) }))

    it('shows names with "today", "tomorrow" and the number of days', async () => {
        render(
            <BirthdaysWidget />,
            new FakeCalendarProvider({
                birthdays: birthdays(
                    ['Ada', '2024-01-15'],
                    ['Grace', '2024-01-16'],
                    ['Linus', '2024-01-20']
                ),
            })
        )

        expect(await screen.findByText('Ada')).toBeInTheDocument()
        expect(screen.getByText('today')).toBeInTheDocument()
        expect(screen.getByText('tomorrow')).toBeInTheDocument()
        expect(screen.getByText('5 days')).toBeInTheDocument()
    })

    it('counts the days in the display zone (B3-style: Tokyo is already on the 16th)', async () => {
        render(
            <BirthdaysWidget />,
            new FakeCalendarProvider({
                birthdays: birthdays(['Ada', '2024-01-16']),
            }),
            { now: '2024-01-15T20:00:00Z', timeZone: 'Asia/Tokyo' }
        )

        expect(await screen.findByText('today')).toBeInTheDocument()
    })

    it('shows at most five', async () => {
        render(
            <BirthdaysWidget />,
            new FakeCalendarProvider({
                birthdays: birthdays(
                    ['A', '2024-01-16'],
                    ['B', '2024-01-17'],
                    ['C', '2024-01-18'],
                    ['D', '2024-01-19'],
                    ['E', '2024-01-20'],
                    ['F', '2024-01-21']
                ),
            })
        )

        expect(await screen.findByText('E')).toBeInTheDocument()
        expect(screen.queryByText('F')).not.toBeInTheDocument()
    })

    it('says so when there are none', async () => {
        render(<BirthdaysWidget />, new FakeCalendarProvider({ birthdays: [] }))

        expect(
            await screen.findByText('No upcoming birthdays')
        ).toBeInTheDocument()
    })

    it('asks the user to sign in, without calling Google', () => {
        const provider = new FakeCalendarProvider({ birthdays: [] })

        render(<BirthdaysWidget />, provider, {
            auth: { status: 'signed-out' },
        })

        expect(
            screen.getByText('Sign in with Google in Settings to see birthdays')
        ).toBeInTheDocument()
        expect(provider.birthdayCalls).toEqual([])
    })

    it('asks to choose a calendar instead of querying an empty id (B11)', () => {
        const provider = new FakeCalendarProvider({ birthdays: [] })

        render(<BirthdaysWidget />, provider, { settings: {} })

        expect(
            screen.getByText('Choose a birthday calendar in Settings')
        ).toBeInTheDocument()
        expect(provider.birthdayCalls).toEqual([])
    })

    it('shows an error message when the birthdays cannot be loaded', async () => {
        render(
            <BirthdaysWidget />,
            new FakeCalendarProvider({ birthdays: new Error('boom') })
        )

        expect(
            await screen.findByText('Error loading birthdays')
        ).toBeInTheDocument()
    })

    it('shows placeholders while loading', () => {
        const { container } = render(
            <BirthdaysWidget />,
            new FakeCalendarProvider({ birthdays: [] })
        )

        expect(
            container.querySelectorAll('.MuiSkeleton-root').length
        ).toBeGreaterThan(0)
    })
})
