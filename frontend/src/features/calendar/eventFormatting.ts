import {
    addDays,
    daysBetween,
    startOfDay,
    toPlainDate,
    type Instant,
    type PlainDate,
    type TimeZoneId,
} from '@/domain/shared/time'
import type { EventSpan } from '@/domain/calendar/CalendarEvent'
import { spanDays } from '@/domain/calendar/eventRules'
import { formatTimeOfDay } from '@/features/time'

interface Options {
    /** "(2/3)" after a multi-day all-day range; off for a summary of several events. */
    readonly showProgress?: boolean
}

const shortDate = (
    at: Instant | PlainDate,
    locale: string,
    timeZone: TimeZoneId
): string =>
    new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        timeZone,
    }).format(typeof at === 'string' ? Date.parse(`${at}T00:00:00Z`) : at)

const describeAllDay = (
    span: Extract<EventSpan, { kind: 'all-day' }>,
    day: PlainDate,
    locale: string,
    { showProgress = true }: Options
): string => {
    const days = spanDays(span)
    if (days <= 1) return 'All day'

    // A date has no zone: it is always printed as it is, never shifted.
    const range = `${shortDate(span.start, locale, 'UTC')}-${shortDate(
        addDays(span.endExclusive, -1),
        locale,
        'UTC'
    )}`
    if (!showProgress) return range
    const position = Math.min(
        days,
        Math.max(1, daysBetween(span.start, day) + 1)
    )
    return `${range} (${position}/${days})`
}

const describeTimed = (
    span: Extract<EventSpan, { kind: 'timed' }>,
    day: PlainDate,
    timeZone: TimeZoneId,
    locale: string
): string => {
    const startsEarlier = toPlainDate(span.start, timeZone) < day
    // An event that ends exactly at midnight is over by then: not "tomorrow".
    const endsLater = span.end > startOfDay(addDays(day, 1), timeZone)
    const from = `${
        startsEarlier ? `${shortDate(span.start, locale, timeZone)} ` : ''
    }${formatTimeOfDay(span.start, timeZone)}`
    const to = `${
        endsLater ? `${shortDate(span.end, locale, timeZone)} ` : ''
    }${formatTimeOfDay(span.end, timeZone)}`
    return `${from}-${to}`
}

/**
 * What to print as the time of an event, as it appears on one day: "All day",
 * a date range with the day's position in it, or start-end with a date added
 * on the side that is not on that day.
 */
export const describeEventTime = (
    span: EventSpan,
    day: PlainDate,
    timeZone: TimeZoneId,
    locale: string,
    options: Options = {}
): string =>
    span.kind === 'all-day'
        ? describeAllDay(span, day, locale, options)
        : describeTimed(span, day, timeZone, locale)
