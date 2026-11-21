import { describe, expect, it } from 'vitest'
import { ProviderResponseError } from '@/application/ports/errors'
import { spanDays } from '@/domain/calendar/eventRules'
import { instant, plainDate } from '@/domain/shared/time'
import {
    mapBirthdays,
    mapCalendarList,
    mapEvents,
} from '@/infrastructure/google/googleCalendarMapper'

const at = (iso: string) => instant(Date.parse(iso))

describe('mapEvents', () => {
    it('maps a timed event to exact instants, whatever offset Google used', () => {
        const [event] = mapEvents({
            items: [
                {
                    summary: 'Standup',
                    description: 'Daily',
                    location: 'Room 1',
                    start: { dateTime: '2024-01-15T09:00:00+01:00' },
                    end: { dateTime: '2024-01-15T09:30:00+01:00' },
                },
            ],
        })

        expect(event).toEqual({
            title: 'Standup',
            description: 'Daily',
            location: 'Room 1',
            span: {
                kind: 'timed',
                start: at('2024-01-15T08:00:00Z'),
                end: at('2024-01-15T08:30:00Z'),
            },
        })
    })

    it('keeps a 24-hour timed event timed (B4: the legacy heuristic called it all-day)', () => {
        const [event] = mapEvents({
            items: [
                {
                    summary: 'Long meeting',
                    start: { dateTime: '2024-01-15T09:00:00Z' },
                    end: { dateTime: '2024-01-16T09:00:00Z' },
                },
            ],
        })

        expect(event.span.kind).toBe('timed')
    })

    it('decides "all-day" by Google\'s own `date` field, with an exclusive end date', () => {
        const [event] = mapEvents({
            items: [
                {
                    summary: 'Holiday',
                    start: { date: '2024-01-15' },
                    end: { date: '2024-01-17' },
                },
            ],
        })

        expect(event.span).toEqual({
            kind: 'all-day',
            start: plainDate('2024-01-15'),
            endExclusive: plainDate('2024-01-17'),
        })
    })

    it('counts the days of an all-day event across a DST change correctly (B4)', () => {
        const [event] = mapEvents({
            items: [
                {
                    summary: 'Trip',
                    start: { date: '2024-03-30' },
                    end: { date: '2024-04-01' },
                },
            ],
        })
        if (event.span.kind !== 'all-day') throw new Error('expected all-day')

        expect(spanDays(event.span)).toBe(2) // the legacy hours % 24 maths gave "not all-day"
    })

    it('treats an all-day event without an end date as a single day', () => {
        const [event] = mapEvents({
            items: [{ summary: 'x', start: { date: '2024-01-15' } }],
        })

        expect(event.span).toMatchObject({
            kind: 'all-day',
            endExclusive: plainDate('2024-01-16'),
        })
    })

    it('defaults missing text fields to empty strings', () => {
        const [event] = mapEvents({
            items: [
                { start: { date: '2024-01-15' }, end: { date: '2024-01-16' } },
            ],
        })

        expect(event).toMatchObject({
            title: '',
            description: '',
            location: '',
        })
    })

    it.each([
        ['no start and no end', {}],
        ['no start', { end: { dateTime: '2024-01-15T10:00:00Z' } }],
        [
            'a timed event without an end',
            { start: { dateTime: '2024-01-15T09:00:00Z' } },
        ],
        [
            'an unparseable dateTime',
            { start: { dateTime: 'soon' }, end: { dateTime: 'later' } },
        ],
        [
            'an unparseable date',
            { start: { date: '2024-13-45' }, end: { date: '2024-13-46' } },
        ],
    ])(
        'drops an event with %s instead of throwing (B4: new Date("") crashed)',
        (_label, event) => {
            expect(
                mapEvents({ items: [{ summary: 'broken', ...event }] })
            ).toEqual([])
        }
    )

    it('keeps the good events around a broken one', () => {
        const result = mapEvents({
            items: [
                {
                    summary: 'a',
                    start: { date: '2024-01-15' },
                    end: { date: '2024-01-16' },
                },
                { summary: 'broken' },
                {
                    summary: 'c',
                    start: { date: '2024-01-17' },
                    end: { date: '2024-01-18' },
                },
            ],
        })

        expect(result.map((e) => e.title)).toEqual(['a', 'c'])
    })

    it('treats a response without items as an empty list', () => {
        expect(mapEvents({})).toEqual([])
    })

    it.each([null, 'text', 42, [], { items: 'nope' }])(
        'rejects the malformed response %j with a ProviderResponseError',
        (payload) => {
            expect(() => mapEvents(payload)).toThrow(ProviderResponseError)
        }
    )
})

describe('mapBirthdays', () => {
    it('maps the name (without the birthday wording) and the date', () => {
        expect(
            mapBirthdays({
                items: [
                    {
                        summary: "John Doe's birthday",
                        start: { date: '2024-01-20' },
                    },
                    {
                        summary: "Jane's Birthday",
                        start: { date: '2024-01-25' },
                    },
                ],
            })
        ).toEqual([
            { name: 'John Doe', date: plainDate('2024-01-20') },
            { name: 'Jane', date: plainDate('2024-01-25') },
        ])
    })

    it('drops events without a date (the legacy code invented "now")', () => {
        expect(
            mapBirthdays({
                items: [
                    { summary: 'no start' },
                    {
                        summary: 'timed',
                        start: { dateTime: '2024-01-20T10:00:00Z' },
                    },
                    { summary: "Ok's birthday", start: { date: '2024-01-20' } },
                ],
            })
        ).toEqual([{ name: 'Ok', date: plainDate('2024-01-20') }])
    })

    it('rejects a malformed response', () => {
        expect(() => mapBirthdays('nope')).toThrow(ProviderResponseError)
    })
})

describe('mapCalendarList', () => {
    it('maps name, id and primary flag', () => {
        expect(
            mapCalendarList({
                items: [
                    { summary: 'Work', id: 'work@x', primary: true },
                    { summary: 'Family', id: 'family@x' },
                ],
            })
        ).toEqual([
            { name: 'Work', id: 'work@x', primary: true },
            { name: 'Family', id: 'family@x', primary: false },
        ])
    })

    it('drops entries without an id (they cannot be selected or queried)', () => {
        expect(
            mapCalendarList({ items: [{ summary: 'No id' }, { id: 'ok' }] })
        ).toEqual([{ name: '', id: 'ok', primary: false }])
    })

    it('rejects a malformed response', () => {
        expect(() => mapCalendarList(null)).toThrow(ProviderResponseError)
    })
})
