import type { Instant, PlainDate } from '@/domain/shared/time'

/** An event with a start and end moment (what Google calls `dateTime`). */
export interface TimedSpan {
    readonly kind: 'timed'
    readonly start: Instant
    readonly end: Instant
}

/**
 * An event that covers whole calendar days (what Google calls `date`). It has
 * no time and no zone: 15 January is 15 January everywhere. The end is the
 * first day NOT covered, as in Google's API.
 */
export interface AllDaySpan {
    readonly kind: 'all-day'
    readonly start: PlainDate
    readonly endExclusive: PlainDate
}

export type EventSpan = TimedSpan | AllDaySpan

export interface CalendarEvent {
    readonly title: string
    readonly description: string
    readonly location: string
    readonly span: EventSpan
}

/** One of the user's calendars, as offered in the settings picker. */
export interface CalendarInfo {
    readonly name: string
    readonly id: string
    readonly primary: boolean
}
