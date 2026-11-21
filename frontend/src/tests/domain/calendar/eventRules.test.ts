import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '@/domain/calendar/CalendarEvent'
import {
    dayBounds,
    eventsOnDay,
    overlapsDay,
    spanDays,
    splitOverflow,
    summarizeOverflow,
} from '@/domain/calendar/eventRules'
import { instant, plainDate } from '@/domain/shared/time'

const at = (iso: string) => instant(Date.parse(iso))
const day = plainDate

const timed = (start: string, end: string, title = 't'): CalendarEvent => ({
    title,
    description: '',
    location: '',
    span: { kind: 'timed', start: at(start), end: at(end) },
})
const allDay = (
    start: string,
    endExclusive: string,
    title = 'a'
): CalendarEvent => ({
    title,
    description: '',
    location: '',
    span: {
        kind: 'all-day',
        start: day(start),
        endExclusive: day(endExclusive),
    },
})

describe('spanDays (B4: the legacy 24h heuristic broke across DST)', () => {
    it.each([
        ['2024-01-15', '2024-01-16', 1],
        ['2024-01-15', '2024-01-18', 3],
        ['2024-03-30', '2024-04-01', 2], // spans the European DST change
        ['2024-10-26', '2024-10-28', 2], // and the one back
    ])('%s to %s (exclusive) is %i day(s)', (start, end, expected) => {
        const event = allDay(start, end)
        if (event.span.kind !== 'all-day') throw new Error('unreachable')

        expect(spanDays(event.span)).toBe(expected)
    })
})

describe('dayBounds', () => {
    it('is local midnight to the next local midnight', () => {
        expect(dayBounds(day('2024-01-16'), 'Asia/Tokyo')).toEqual({
            start: at('2024-01-15T15:00:00Z'),
            end: at('2024-01-16T15:00:00Z'),
        })
    })

    it('follows the length of a DST day', () => {
        const { start, end } = dayBounds(day('2024-03-31'), 'Europe/Berlin')

        expect((end - start) / 3_600_000).toBe(23)
    })
})

describe('overlapsDay', () => {
    it('is true for a timed event inside the day', () => {
        expect(
            overlapsDay(
                timed('2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z'),
                day('2024-01-15'),
                'UTC'
            )
        ).toBe(true)
    })

    it('is true for each day a timed event spans', () => {
        const event = timed('2024-01-15T22:00:00Z', '2024-01-16T02:00:00Z')

        expect(overlapsDay(event, day('2024-01-15'), 'UTC')).toBe(true)
        expect(overlapsDay(event, day('2024-01-16'), 'UTC')).toBe(true)
        expect(overlapsDay(event, day('2024-01-17'), 'UTC')).toBe(false)
    })

    it('does not count an event that ends exactly at midnight for the next day', () => {
        const event = timed('2024-01-15T22:00:00Z', '2024-01-16T00:00:00Z')

        expect(overlapsDay(event, day('2024-01-16'), 'UTC')).toBe(false)
    })

    it('counts an event that starts exactly at midnight, and a zero-length one', () => {
        expect(
            overlapsDay(
                timed('2024-01-16T00:00:00Z', '2024-01-16T01:00:00Z'),
                day('2024-01-16'),
                'UTC'
            )
        ).toBe(true)
        expect(
            overlapsDay(
                timed('2024-01-16T10:00:00Z', '2024-01-16T10:00:00Z'),
                day('2024-01-16'),
                'UTC'
            )
        ).toBe(true)
    })

    it('judges the day in the display zone, not in UTC', () => {
        // 23:30Z on the 15th is 08:30 on the 16th in Tokyo
        const event = timed('2024-01-15T23:30:00Z', '2024-01-16T00:30:00Z')

        expect(overlapsDay(event, day('2024-01-16'), 'Asia/Tokyo')).toBe(true)
        expect(overlapsDay(event, day('2024-01-15'), 'Asia/Tokyo')).toBe(false)
    })

    it('covers every day of an all-day event up to (excluding) its end date', () => {
        const event = allDay('2024-01-15', '2024-01-17')

        expect(overlapsDay(event, day('2024-01-14'), 'UTC')).toBe(false)
        expect(overlapsDay(event, day('2024-01-15'), 'UTC')).toBe(true)
        expect(overlapsDay(event, day('2024-01-16'), 'UTC')).toBe(true)
        expect(overlapsDay(event, day('2024-01-17'), 'UTC')).toBe(false)
    })

    it('does not move an all-day event with the zone (a date has no zone)', () => {
        const event = allDay('2024-01-15', '2024-01-16')

        for (const zone of ['Pacific/Auckland', 'America/Los_Angeles']) {
            expect(overlapsDay(event, day('2024-01-15'), zone)).toBe(true)
            expect(overlapsDay(event, day('2024-01-16'), zone)).toBe(false)
        }
    })
})

describe('eventsOnDay', () => {
    const events = [
        timed('2024-01-15T08:00:00Z', '2024-01-15T09:00:00Z', 'early'),
        timed('2024-01-15T12:00:00Z', '2024-01-15T13:00:00Z', 'noon'),
        allDay('2024-01-15', '2024-01-17', 'trip'),
        timed('2024-01-16T09:00:00Z', '2024-01-16T10:00:00Z', 'tomorrow'),
    ]

    it('keeps the events of the day in their input order', () => {
        const titles = eventsOnDay(events, day('2024-01-16'), 'UTC').map(
            (e) => e.title
        )

        expect(titles).toEqual(['trip', 'tomorrow'])
    })

    it('drops what already ended when a "from" instant is given (today only shows what is left)', () => {
        const titles = eventsOnDay(
            events,
            day('2024-01-15'),
            'UTC',
            at('2024-01-15T10:00:00Z')
        ).map((e) => e.title)

        expect(titles).toEqual(['noon', 'trip'])
    })

    it('keeps an event that is still running at "from"', () => {
        const titles = eventsOnDay(
            events,
            day('2024-01-15'),
            'UTC',
            at('2024-01-15T08:30:00Z')
        ).map((e) => e.title)

        expect(titles).toContain('early')
    })

    it('ignores "from" for other days', () => {
        const titles = eventsOnDay(
            events,
            day('2024-01-16'),
            'UTC',
            at('2024-01-15T10:00:00Z')
        ).map((e) => e.title)

        expect(titles).toEqual(['trip', 'tomorrow'])
    })
})

describe('splitOverflow', () => {
    const list = ['a', 'b', 'c', 'd'].map((title) =>
        timed('2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z', title)
    )

    it('shows everything when it fits', () => {
        expect(splitOverflow(list, 4)).toEqual({ visible: list, hidden: [] })
        expect(splitOverflow(list, 9)).toEqual({ visible: list, hidden: [] })
    })

    it('keeps one slot for the "N more" summary when it does not fit', () => {
        const { visible, hidden } = splitOverflow(list, 2)

        expect(visible.map((e) => e.title)).toEqual(['a'])
        expect(hidden.map((e) => e.title)).toEqual(['b', 'c', 'd'])
    })

    it('can hide everything behind the summary when there is a single slot', () => {
        const { visible, hidden } = splitOverflow(list, 1)

        expect(visible).toEqual([])
        expect(hidden).toHaveLength(4)
    })
})

describe('summarizeOverflow', () => {
    it('counts the hidden events and spans from the first start to the last end', () => {
        const hidden = [
            timed('2024-01-15T13:00:00Z', '2024-01-15T14:00:00Z'),
            timed('2024-01-15T15:00:00Z', '2024-01-15T18:00:00Z'),
            timed('2024-01-15T16:00:00Z', '2024-01-15T17:00:00Z'),
        ]

        expect(summarizeOverflow(hidden, 'UTC')).toEqual({
            count: 3,
            span: {
                kind: 'timed',
                start: at('2024-01-15T13:00:00Z'),
                end: at('2024-01-15T18:00:00Z'),
            },
        })
    })

    it('becomes an all-day span as soon as one hidden event is all-day', () => {
        const hidden = [
            timed('2024-01-15T13:00:00Z', '2024-01-15T14:00:00Z'),
            allDay('2024-01-15', '2024-01-17'),
        ]

        expect(summarizeOverflow(hidden, 'UTC')).toEqual({
            count: 2,
            span: {
                kind: 'all-day',
                start: day('2024-01-15'),
                endExclusive: day('2024-01-17'),
            },
        })
    })
})
