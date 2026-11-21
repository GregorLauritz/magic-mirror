import {
    addDays,
    daysBetween,
    startOfDay,
    toPlainDate,
    type Instant,
    type PlainDate,
    type TimeZoneId,
} from '@/domain/shared/time'
import type { AllDaySpan, CalendarEvent, EventSpan } from './CalendarEvent'

/** How many days an all-day event covers (the end date is exclusive). */
export const spanDays = (span: AllDaySpan): number =>
    daysBetween(span.start, span.endExclusive)

/** From the first instant of a day to the first instant of the next. */
export const dayBounds = (
    day: PlainDate,
    timeZone: TimeZoneId
): { readonly start: Instant; readonly end: Instant } => ({
    start: startOfDay(day, timeZone),
    end: startOfDay(addDays(day, 1), timeZone),
})

const overlaps = (
    span: EventSpan,
    day: PlainDate,
    bounds: { readonly start: Instant; readonly end: Instant }
): boolean => {
    if (span.kind === 'all-day') {
        return span.start <= day && day < span.endExclusive
    }
    // Starts before the day ends, and either ends after it began or starts in
    // it (so an event ending exactly at midnight belongs to the earlier day,
    // while an instant at midnight belongs to the later one).
    return (
        span.start < bounds.end &&
        (span.end > bounds.start || span.start >= bounds.start)
    )
}

/** Whether an event is on a given calendar day in the display zone. */
export const overlapsDay = (
    event: CalendarEvent,
    day: PlainDate,
    timeZone: TimeZoneId
): boolean => overlaps(event.span, day, dayBounds(day, timeZone))

/**
 * The events on a day, in their input order. With `from`, timed events that
 * are already over at that moment are left out, so "today" shows what remains.
 */
export const eventsOnDay = (
    events: readonly CalendarEvent[],
    day: PlainDate,
    timeZone: TimeZoneId,
    from?: Instant
): CalendarEvent[] => {
    const bounds = dayBounds(day, timeZone)
    return events.filter(
        ({ span }) =>
            overlaps(span, day, bounds) &&
            !(span.kind === 'timed' && from !== undefined && span.end <= from)
    )
}

/**
 * Fits a list into `max` slots. When it does not fit, the last slot becomes a
 * summary line, so `max - 1` events stay visible and the rest are hidden.
 */
export const splitOverflow = <T>(
    list: readonly T[],
    max: number
): { readonly visible: T[]; readonly hidden: T[] } =>
    list.length <= max
        ? { visible: [...list], hidden: [] }
        : {
              visible: list.slice(0, Math.max(0, max - 1)),
              hidden: list.slice(Math.max(0, max - 1)),
          }

export interface OverflowSummary {
    readonly count: number
    /** What the hidden events cover together. */
    readonly span: EventSpan
}

// The days a timed event touches, as [first, last + 1).
const daysOfTimed = (
    span: Extract<EventSpan, { kind: 'timed' }>,
    timeZone: TimeZoneId
): { start: PlainDate; endExclusive: PlainDate } => {
    const lastMoment = Math.max(span.start, span.end - 1) as Instant
    return {
        start: toPlainDate(span.start, timeZone),
        endExclusive: addDays(toPlainDate(lastMoment, timeZone), 1),
    }
}

/**
 * Describes hidden events as one: how many, and the stretch of time they
 * cover. If any of them is an all-day event the stretch is given in days.
 */
export const summarizeOverflow = (
    hidden: readonly CalendarEvent[],
    timeZone: TimeZoneId
): OverflowSummary => {
    const spans = hidden.map((event) => event.span)

    if (spans.some((span) => span.kind === 'all-day')) {
        const days = spans.map((span) =>
            span.kind === 'all-day' ? span : daysOfTimed(span, timeZone)
        )
        return {
            count: hidden.length,
            span: {
                kind: 'all-day',
                start: days.reduce(
                    (min, d) => (d.start < min ? d.start : min),
                    days[0].start
                ),
                endExclusive: days.reduce(
                    (max, d) => (d.endExclusive > max ? d.endExclusive : max),
                    days[0].endExclusive
                ),
            },
        }
    }

    const timed = spans as Array<Extract<EventSpan, { kind: 'timed' }>>
    return {
        count: hidden.length,
        span: {
            kind: 'timed',
            start: Math.min(...timed.map((s) => s.start)) as Instant,
            end: Math.max(...timed.map((s) => s.end)) as Instant,
        },
    }
}
