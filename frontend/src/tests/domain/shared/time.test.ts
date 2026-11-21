import { describe, expect, it } from 'vitest'
import {
    addDays,
    daysBetween,
    floorToMinute,
    instant,
    plainDate,
    startOfDay,
    toPlainDate,
    utcOffsetMinutes,
    zonedParts,
} from '@/domain/shared/time'

const at = (iso: string) => instant(Date.parse(iso))

describe('instant', () => {
    it('wraps a finite epoch-milliseconds number', () => {
        expect(instant(1_700_000_000_000)).toBe(1_700_000_000_000)
        expect(instant(0)).toBe(0)
        expect(instant(-1)).toBe(-1)
    })

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
        'rejects the non-finite value %s',
        (value) => {
            expect(() => instant(value)).toThrow(RangeError)
        }
    )
})

describe('floorToMinute', () => {
    it('drops seconds and milliseconds', () => {
        expect(floorToMinute(at('2024-01-15T12:34:56.789Z'))).toBe(
            at('2024-01-15T12:34:00.000Z')
        )
    })

    it('keeps an exact minute and floors negative epochs downwards', () => {
        expect(floorToMinute(at('2024-01-15T12:34:00Z'))).toBe(
            at('2024-01-15T12:34:00Z')
        )
        expect(floorToMinute(instant(-1))).toBe(-60_000)
    })
})

describe('plainDate', () => {
    it('accepts a valid calendar date', () => {
        expect(plainDate('2024-01-15')).toBe('2024-01-15')
        expect(plainDate('2024-02-29')).toBe('2024-02-29') // leap year
    })

    it.each([
        '2023-02-29',
        '2024-13-01',
        '2024-00-10',
        '2024-04-31',
        '15.01.2024',
        '2024-1-5',
        '',
    ])('rejects %j', (value) => {
        expect(() => plainDate(value)).toThrow(RangeError)
    })
})

describe('zonedParts', () => {
    it('reads the wall-clock fields in the given zone, not the host zone', () => {
        expect(zonedParts(at('2024-01-15T15:26:07Z'), 'Asia/Tokyo')).toEqual({
            year: 2024,
            month: 1,
            day: 16,
            hour: 0,
            minute: 26,
            second: 7,
        })
    })

    it('uses 00 rather than 24 for the hour at local midnight', () => {
        expect(zonedParts(at('2024-01-15T00:00:00Z'), 'UTC').hour).toBe(0)
        expect(zonedParts(at('2024-01-15T15:00:00Z'), 'Asia/Tokyo').hour).toBe(
            0
        )
    })
})

describe('toPlainDate', () => {
    it('is the calendar day in the zone, which can differ from the UTC day', () => {
        const lateEvening = at('2024-01-15T23:30:00Z')

        expect(toPlainDate(lateEvening, 'UTC')).toBe('2024-01-15')
        expect(toPlainDate(lateEvening, 'Asia/Tokyo')).toBe('2024-01-16')
        expect(
            toPlainDate(at('2024-01-15T05:00:00Z'), 'America/Los_Angeles')
        ).toBe('2024-01-14')
    })
})

describe('utcOffsetMinutes', () => {
    it.each([
        ['UTC', '2024-01-15T12:00:00Z', 0],
        ['Asia/Tokyo', '2024-01-15T12:00:00Z', 540],
        ['Asia/Kolkata', '2024-01-15T12:00:00Z', 330],
        ['Asia/Kathmandu', '2024-01-15T12:00:00Z', 345],
        ['America/St_Johns', '2024-01-15T12:00:00Z', -210],
        ['America/St_Johns', '2024-07-15T12:00:00Z', -150],
        ['America/Los_Angeles', '2024-01-15T12:00:00Z', -480],
        ['America/Los_Angeles', '2024-07-15T12:00:00Z', -420],
        ['Pacific/Auckland', '2024-01-15T12:00:00Z', 780],
        ['Pacific/Auckland', '2024-07-15T12:00:00Z', 720],
    ])('%s at %s is UTC%i minutes', (zone, iso, expected) => {
        expect(utcOffsetMinutes(at(iso), zone)).toBe(expected)
    })

    it('switches exactly at the daylight-saving transition (Europe/Berlin, 2024-03-31)', () => {
        expect(
            utcOffsetMinutes(at('2024-03-31T00:59:59Z'), 'Europe/Berlin')
        ).toBe(60)
        expect(
            utcOffsetMinutes(at('2024-03-31T01:00:00Z'), 'Europe/Berlin')
        ).toBe(120)
    })
})

describe('addDays / daysBetween', () => {
    it.each([
        ['2024-01-31', 1, '2024-02-01'],
        ['2023-12-31', 1, '2024-01-01'],
        ['2024-03-01', -1, '2024-02-29'], // leap year
        ['2023-03-01', -1, '2023-02-28'],
        ['2024-01-15', 0, '2024-01-15'],
        ['2024-01-15', 400, '2025-02-18'],
    ])('%s + %i days is %s', (date, days, expected) => {
        expect(addDays(plainDate(date), days)).toBe(expected)
    })

    it.each([
        ['2024-01-15', '2024-01-20', 5],
        ['2024-01-20', '2024-01-15', -5],
        ['2024-01-15', '2024-01-15', 0],
        ['2024-02-28', '2024-03-01', 2], // 2024 is a leap year
        ['2024-03-30', '2024-04-01', 2], // across the European DST change: still whole days
    ])('from %s to %s is %i days', (from, to, expected) => {
        expect(daysBetween(plainDate(from), plainDate(to))).toBe(expected)
    })
})

describe('startOfDay', () => {
    it.each([
        ['UTC', '2024-01-15', '2024-01-15T00:00:00Z'],
        ['Asia/Tokyo', '2024-01-15', '2024-01-14T15:00:00Z'],
        ['America/Los_Angeles', '2024-01-15', '2024-01-15T08:00:00Z'],
        ['Asia/Kolkata', '2024-01-15', '2024-01-14T18:30:00Z'],
        ['Pacific/Auckland', '2024-01-15', '2024-01-14T11:00:00Z'], // NZDT, UTC+13
    ])('local midnight of %s on %s', (zone, date, utcIso) => {
        expect(startOfDay(plainDate(date), zone)).toBe(at(utcIso))
    })

    it('has a 23-hour day when the clocks go forward (Europe/Berlin, 2024-03-31)', () => {
        const start = startOfDay(plainDate('2024-03-31'), 'Europe/Berlin')
        const next = startOfDay(plainDate('2024-04-01'), 'Europe/Berlin')

        expect(start).toBe(at('2024-03-30T23:00:00Z'))
        expect((next - start) / 3_600_000).toBe(23)
    })

    it('has a 25-hour day when the clocks go back (Europe/Berlin, 2024-10-27)', () => {
        const start = startOfDay(plainDate('2024-10-27'), 'Europe/Berlin')
        const next = startOfDay(plainDate('2024-10-28'), 'Europe/Berlin')

        expect(start).toBe(at('2024-10-26T22:00:00Z'))
        expect((next - start) / 3_600_000).toBe(25)
    })

    it('round-trips with toPlainDate', () => {
        for (const zone of [
            'UTC',
            'Asia/Tokyo',
            'America/St_Johns',
            'Pacific/Auckland',
        ]) {
            const midnight = startOfDay(plainDate('2024-06-10'), zone)

            expect(toPlainDate(midnight, zone)).toBe('2024-06-10')
            expect(toPlainDate(instant(midnight - 1), zone)).toBe('2024-06-09')
        }
    })
})
