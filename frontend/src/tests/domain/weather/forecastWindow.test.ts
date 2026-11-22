import { describe, expect, it } from 'vitest'
import { instant, plainDate } from '@/domain/shared/time'
import { dailyAfterToday, upcomingHours } from '@/domain/weather/forecastWindow'

const at = (iso: string) => instant(Date.parse(iso))
const hour = (iso: string) => ({ at: at(iso) })
const day = (iso: string) => ({ date: plainDate(iso) })

const HOURS = ['09', '10', '11', '12', '13', '14', '15'].map((h) =>
    hour(`2024-01-15T${h}:00:00Z`)
)

describe('upcomingHours', () => {
    it('keeps entries after now, up to now + count hours, dropping the past', () => {
        const result = upcomingHours(HOURS, at('2024-01-15T10:20:00Z'), 3)

        expect(result.map((e) => new Date(e.at).getUTCHours())).toEqual([
            11, 12, 13,
        ])
    })

    it('excludes an entry that starts exactly now but includes one exactly count hours ahead', () => {
        const result = upcomingHours(HOURS, at('2024-01-15T11:00:00Z'), 2)

        expect(result.map((e) => new Date(e.at).getUTCHours())).toEqual([
            12, 13,
        ])
    })

    it('always yields exactly count entries on an hourly series, wherever now falls', () => {
        // The clock is floored to the minute, so "now" often sits exactly on
        // the hour; a closed lower bound would then show count + 1 columns.
        const series = Array.from({ length: 24 }, (_, i) =>
            hour(`2024-01-15T${String(i).padStart(2, '0')}:00:00Z`)
        )
        for (const now of ['10:00:00', '10:00:30', '10:20:00', '10:59:00']) {
            expect(
                upcomingHours(series, at(`2024-01-15T${now}Z`), 5)
            ).toHaveLength(5)
        }
    })

    it('returns nothing when every entry is in the past or the list is empty', () => {
        expect(upcomingHours(HOURS, at('2024-01-15T20:00:00Z'), 5)).toEqual([])
        expect(upcomingHours([], at('2024-01-15T10:00:00Z'), 5)).toEqual([])
    })

    it('keeps the order of the input and does not mutate it', () => {
        const input = [...HOURS]

        upcomingHours(input, at('2024-01-15T10:20:00Z'), 5)

        expect(input).toEqual(HOURS)
    })
})

describe('dailyAfterToday', () => {
    const DAYS = ['15', '16', '17', '18', '19', '20'].map((d) =>
        day(`2024-01-${d}`)
    )

    it('skips today and keeps the next count days', () => {
        const result = dailyAfterToday(DAYS, plainDate('2024-01-15'), 4)

        expect(result.map((d) => d.date)).toEqual([
            '2024-01-16',
            '2024-01-17',
            '2024-01-18',
            '2024-01-19',
        ])
    })

    it('also skips days before today (a stale response after midnight)', () => {
        const result = dailyAfterToday(DAYS, plainDate('2024-01-17'), 2)

        expect(result.map((d) => d.date)).toEqual(['2024-01-18', '2024-01-19'])
    })

    it('returns fewer entries when the forecast is shorter than requested', () => {
        expect(dailyAfterToday(DAYS, plainDate('2024-01-19'), 4)).toHaveLength(
            1
        )
        expect(dailyAfterToday(DAYS, plainDate('2024-01-20'), 4)).toEqual([])
    })
})
