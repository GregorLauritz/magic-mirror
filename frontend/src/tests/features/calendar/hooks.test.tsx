import { describe, expect, it } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useBirthdays } from '@/features/calendar/hooks/useBirthdays'
import { useCalendarList } from '@/features/calendar/hooks/useCalendarList'
import { useUpcomingEvents } from '@/features/calendar/hooks/useUpcomingEvents'
import { instant, plainDate } from '@/domain/shared/time'
import {
    createTestContainer,
    type TestContainerOptions,
} from '../../support/createTestContainer'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { FakeCalendarProvider } from '../../support/FakeCalendarProvider'
import { renderHookWithDeps } from '../../support/renderWithDeps'
import { timedEvent } from '../../support/calendarFixtures'

const at = (iso: string) => instant(Date.parse(iso))
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

const setup = (
    provider: FakeCalendarProvider,
    options: TestContainerOptions = {}
) =>
    createTestContainer({
        calendarProvider: provider,
        authSession: new FakeAuthSession({ status: 'signed-in' }),
        now: '2024-01-15T12:00:00Z',
        timeZone: 'UTC',
        ...options,
    })

const EVENTS = [timedEvent('A', '2024-01-15T13:00:00Z', '2024-01-15T14:00:00Z')]

describe('useUpcomingEvents', () => {
    it('loads the events of the next three days in one request', async () => {
        const provider = new FakeCalendarProvider({ events: EVENTS })
        const test = setup(provider)

        const { result } = renderHookWithDeps(
            () => useUpcomingEvents('work@x'),
            {
                deps: test.deps,
            }
        )

        await waitFor(() => expect(result.current.events).toEqual(EVENTS))
        expect(provider.eventCalls).toEqual([
            {
                calendarId: 'work@x',
                from: at('2024-01-15T12:00:00Z'),
                to: at('2024-01-18T00:00:00Z'),
                limit: 100,
            },
        ])
    })

    it.each([undefined, '', '   '])(
        'falls back to the primary calendar when the calendar id is %j (as before)',
        async (calendarId) => {
            const provider = new FakeCalendarProvider({ events: [] })
            const test = setup(provider)

            const { result } = renderHookWithDeps(
                () => useUpcomingEvents(calendarId),
                {
                    deps: test.deps,
                }
            )

            await waitFor(() => expect(result.current.events).toEqual([]))
            expect(provider.eventCalls[0].calendarId).toBe('primary')
        }
    )

    it('does not call Google while signed out', async () => {
        const provider = new FakeCalendarProvider({ events: EVENTS })
        const test = setup(provider, {
            authSession: new FakeAuthSession({ status: 'signed-out' }),
        })

        const { result } = renderHookWithDeps(() => useUpcomingEvents('cal'), {
            deps: test.deps,
        })
        await settle()

        expect(provider.eventCalls).toEqual([])
        expect(result.current.events).toBeUndefined()
    })

    it('reports a failure', async () => {
        const provider = new FakeCalendarProvider({ events: new Error('boom') })
        const test = setup(provider)

        const { result } = renderHookWithDeps(() => useUpcomingEvents('cal'), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
    })

    it('refetches at local midnight, so tomorrow becomes today without a reload', async () => {
        const provider = new FakeCalendarProvider({ events: EVENTS })
        const test = setup(provider, { now: '2024-01-15T23:59:30Z' })
        const { result } = renderHookWithDeps(() => useUpcomingEvents('cal'), {
            deps: test.deps,
        })
        await waitFor(() => expect(result.current.events).toBeDefined())
        expect(provider.eventCalls).toHaveLength(1)

        act(() => test.scheduler.advance(30_000)) // 00:00:00 on the 16th

        await waitFor(() => expect(provider.eventCalls).toHaveLength(2))
        expect(provider.eventCalls[1]).toMatchObject({
            from: at('2024-01-16T00:00:00Z'),
            to: at('2024-01-19T00:00:00Z'),
        })
    })

    it('polls on the configured refresh interval', async () => {
        const provider = new FakeCalendarProvider({ events: EVENTS })
        const test = setup(provider, { config: { refreshIntervalMs: 20 } })
        renderHookWithDeps(() => useUpcomingEvents('cal'), { deps: test.deps })

        await waitFor(() =>
            expect(provider.eventCalls.length).toBeGreaterThanOrEqual(2)
        )
    })
})

describe('useBirthdays', () => {
    const BIRTHDAYS = [{ name: 'Ada', date: plainDate('2024-01-20') }]

    it('loads the next birthdays of the configured calendar', async () => {
        const provider = new FakeCalendarProvider({ birthdays: BIRTHDAYS })
        const test = setup(provider)

        const { result } = renderHookWithDeps(() => useBirthdays('bday@x', 5), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.birthdays).toEqual(BIRTHDAYS))
        expect(provider.birthdayCalls).toEqual([
            {
                calendarId: 'bday@x',
                from: at('2024-01-15T12:00:00Z'),
                limit: 5,
            },
        ])
    })

    it.each([undefined, '', '  '])(
        'does not query a calendar when the id is %j (B11: the legacy code requested /calendars//events)',
        async (calendarId) => {
            const provider = new FakeCalendarProvider({ birthdays: BIRTHDAYS })
            const test = setup(provider)

            const { result } = renderHookWithDeps(
                () => useBirthdays(calendarId, 5),
                {
                    deps: test.deps,
                }
            )
            await settle()

            expect(provider.birthdayCalls).toEqual([])
            expect(result.current.isConfigured).toBe(false)
        }
    )

    it('does not call Google while signed out', async () => {
        const provider = new FakeCalendarProvider({ birthdays: BIRTHDAYS })
        const test = setup(provider, {
            authSession: new FakeAuthSession({ status: 'signed-out' }),
        })

        renderHookWithDeps(() => useBirthdays('cal', 5), { deps: test.deps })
        await settle()

        expect(provider.birthdayCalls).toEqual([])
    })

    it('reports a failure', async () => {
        const provider = new FakeCalendarProvider({
            birthdays: new Error('boom'),
        })
        const test = setup(provider)

        const { result } = renderHookWithDeps(() => useBirthdays('cal', 5), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
    })
})

describe('useCalendarList', () => {
    const CALENDARS = [{ name: 'Work', id: 'w', primary: true }]

    it('lists the calendars of the signed-in user', async () => {
        const provider = new FakeCalendarProvider({ calendars: CALENDARS })
        const test = setup(provider)

        const { result } = renderHookWithDeps(() => useCalendarList(), {
            deps: test.deps,
        })

        await waitFor(() => expect(result.current.calendars).toEqual(CALENDARS))
    })

    it('does not call Google while signed out, and defaults to an empty list for pickers', async () => {
        const provider = new FakeCalendarProvider({ calendars: CALENDARS })
        const test = setup(provider, {
            authSession: new FakeAuthSession({ status: 'signed-out' }),
        })

        const { result } = renderHookWithDeps(() => useCalendarList(), {
            deps: test.deps,
        })
        await settle()

        expect(provider.listCalls).toBe(0)
        expect(result.current.calendars).toEqual([])
    })

    it('can be switched off by the caller', async () => {
        const provider = new FakeCalendarProvider({ calendars: CALENDARS })
        const test = setup(provider)

        renderHookWithDeps(() => useCalendarList({ enabled: false }), {
            deps: test.deps,
        })
        await settle()

        expect(provider.listCalls).toBe(0)
    })

    it('serves a repeated mount from the cache (one request)', async () => {
        const provider = new FakeCalendarProvider({ calendars: CALENDARS })
        const test = setup(provider)
        const first = renderHookWithDeps(() => useCalendarList(), {
            deps: test.deps,
        })
        await waitFor(() =>
            expect(first.result.current.calendars).toEqual(CALENDARS)
        )

        renderHookWithDeps(() => useCalendarList(), { deps: test.deps })
        await settle()

        expect(provider.listCalls).toBe(1)
    })
})
