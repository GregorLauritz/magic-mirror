import { describe, expect, it } from 'vitest'
import { describeEventTime } from '@/features/calendar/eventFormatting'
import { instant, plainDate } from '@/domain/shared/time'
import type { EventSpan } from '@/domain/calendar/CalendarEvent'

const at = (iso: string) => instant(Date.parse(iso))
const timed = (start: string, end: string): EventSpan => ({
    kind: 'timed',
    start: at(start),
    end: at(end),
})
const allDay = (start: string, endExclusive: string): EventSpan => ({
    kind: 'all-day',
    start: plainDate(start),
    endExclusive: plainDate(endExclusive),
})
const describe_ = (
    span: EventSpan,
    day: string,
    zone = 'UTC',
    options?: { showProgress?: boolean }
) => describeEventTime(span, plainDate(day), zone, 'en-US', options)

describe('describeEventTime', () => {
    describe('all-day events', () => {
        it('says "All day" for a single day', () => {
            expect(
                describe_(allDay('2024-01-15', '2024-01-16'), '2024-01-15')
            ).toBe('All day')
        })

        it('shows the range and which day of it this is', () => {
            const trip = allDay('2024-01-15', '2024-01-18') // 15th to 17th

            expect(describe_(trip, '2024-01-15')).toBe('Jan 15-Jan 17 (1/3)')
            expect(describe_(trip, '2024-01-16')).toBe('Jan 15-Jan 17 (2/3)')
            expect(describe_(trip, '2024-01-17')).toBe('Jan 15-Jan 17 (3/3)')
        })

        it('can omit the progress, for a summary of several events', () => {
            expect(
                describe_(
                    allDay('2024-01-15', '2024-01-18'),
                    '2024-01-16',
                    'UTC',
                    { showProgress: false }
                )
            ).toBe('Jan 15-Jan 17')
        })

        it('does not depend on the display zone', () => {
            const trip = allDay('2024-01-15', '2024-01-17')

            expect(describe_(trip, '2024-01-15', 'Pacific/Auckland')).toBe(
                describe_(trip, '2024-01-15', 'America/Los_Angeles')
            )
        })
    })

    describe('timed events', () => {
        it('shows start and end time for an event within the day', () => {
            expect(
                describe_(
                    timed('2024-01-15T09:00:00Z', '2024-01-15T10:30:00Z'),
                    '2024-01-15'
                )
            ).toBe('09:00-10:30')
        })

        it('shows the start date for an event that began on an earlier day', () => {
            expect(
                describe_(
                    timed('2024-01-14T22:00:00Z', '2024-01-15T02:00:00Z'),
                    '2024-01-15'
                )
            ).toBe('Jan 14 22:00-02:00')
        })

        it('shows the end date for an event that ends on a later day', () => {
            expect(
                describe_(
                    timed('2024-01-15T22:00:00Z', '2024-01-16T02:00:00Z'),
                    '2024-01-15'
                )
            ).toBe('22:00-Jan 16 02:00')
        })

        it('does not call an event that ends exactly at midnight multi-day', () => {
            expect(
                describe_(
                    timed('2024-01-15T22:00:00Z', '2024-01-16T00:00:00Z'),
                    '2024-01-15'
                )
            ).toBe('22:00-00:00')
        })

        it('formats the times in the display zone', () => {
            expect(
                describe_(
                    timed('2024-01-15T12:00:00Z', '2024-01-15T13:30:00Z'),
                    '2024-01-15',
                    'Asia/Tokyo'
                )
            ).toBe('21:00-22:30')
        })

        it('judges "another day" in the display zone too', () => {
            // 23:30Z-00:30Z is 08:30-09:30 on the 16th in Tokyo: one day, not two
            expect(
                describe_(
                    timed('2024-01-15T23:30:00Z', '2024-01-16T00:30:00Z'),
                    '2024-01-16',
                    'Asia/Tokyo'
                )
            ).toBe('08:30-09:30')
        })

        it('copes with a zero-length event', () => {
            expect(
                describe_(
                    timed('2024-01-15T09:00:00Z', '2024-01-15T09:00:00Z'),
                    '2024-01-15'
                )
            ).toBe('09:00-09:00')
        })
    })
})
