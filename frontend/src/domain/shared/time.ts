// Time primitives for the pure domain. Nothing here reads the system clock:
// "now" always arrives through the Clock port, and every zone-dependent
// computation takes an explicit IANA time zone.

/** A point on the UTC timeline, in epoch milliseconds. */
export type Instant = number & { readonly __brand: 'Instant' }

/** An IANA time zone identifier such as "Europe/Berlin". */
export type TimeZoneId = string

export const instant = (epochMs: number): Instant => {
    if (!Number.isFinite(epochMs)) {
        throw new RangeError(`Not a valid instant: ${epochMs}`)
    }
    return epochMs as Instant
}

/** A calendar day without a time or zone, formatted "YYYY-MM-DD". */
export type PlainDate = string & { readonly __brand: 'PlainDate' }

const MINUTE_MS = 60_000
const PLAIN_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export const floorToMinute = (at: Instant): Instant =>
    instant(Math.floor(at / MINUTE_MS) * MINUTE_MS)

/** Validates a real calendar date (rejects 2023-02-29, 2024-04-31, ...). */
export const plainDate = (value: string): PlainDate => {
    const match = PLAIN_DATE_PATTERN.exec(value)
    if (match !== null) {
        const [year, month, day] = [match[1], match[2], match[3]].map(Number)
        const probe = new Date(Date.UTC(year, month - 1, day))
        if (
            probe.getUTCFullYear() === year &&
            probe.getUTCMonth() === month - 1 &&
            probe.getUTCDate() === day
        ) {
            return value as PlainDate
        }
    }
    throw new RangeError(`Not a valid plain date: "${value}"`)
}

export interface ZonedParts {
    readonly year: number
    readonly month: number
    readonly day: number
    readonly hour: number
    readonly minute: number
    readonly second: number
}

const formatters = new Map<TimeZoneId, Intl.DateTimeFormat>()

const formatterFor = (timeZone: TimeZoneId): Intl.DateTimeFormat => {
    let formatter = formatters.get(timeZone)
    if (formatter === undefined) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            // h23: midnight is hour 0, never "24" (hour12: false can yield 24)
            hourCycle: 'h23',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
        formatters.set(timeZone, formatter)
    }
    return formatter
}

/** The wall-clock fields of an instant as seen in an explicit time zone. */
export const zonedParts = (at: Instant, timeZone: TimeZoneId): ZonedParts => {
    const parts = formatterFor(timeZone).formatToParts(at)
    const field = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((part) => part.type === type)?.value)
    return {
        year: field('year'),
        month: field('month'),
        day: field('day'),
        hour: field('hour'),
        minute: field('minute'),
        second: field('second'),
    }
}

/** The calendar day an instant falls on in the given zone. */
export const toPlainDate = (at: Instant, timeZone: TimeZoneId): PlainDate => {
    const { year, month, day } = zonedParts(at, timeZone)
    const pad = (value: number, width: number) =>
        String(value).padStart(width, '0')
    return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as PlainDate
}

/** Offset of the zone from UTC at that instant, in minutes (east is positive). */
export const utcOffsetMinutes = (at: Instant, timeZone: TimeZoneId): number => {
    const parts = zonedParts(at, timeZone)
    const wallClockAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    )
    const wholeSeconds = Math.floor(at / 1000) * 1000
    return Math.round((wallClockAsUtc - wholeSeconds) / MINUTE_MS)
}

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

const utcMidnightOf = (date: PlainDate): number =>
    Date.parse(`${date}T00:00:00Z`)

/**
 * A calendar date plus a number of days. Pure date arithmetic: it never
 * touches a clock or a zone, so a daylight-saving change cannot skew it.
 */
export const addDays = (date: PlainDate, days: number): PlainDate =>
    plainDate(
        new Date(utcMidnightOf(date) + days * DAY_MS).toISOString().slice(0, 10)
    )

/** Whole days from one calendar date to another (negative when `to` is earlier). */
export const daysBetween = (from: PlainDate, to: PlainDate): number =>
    Math.round((utcMidnightOf(to) - utcMidnightOf(from)) / DAY_MS)

/**
 * The first instant of a calendar day in a zone. Days are 23 or 25 hours long
 * when the clocks change, and in a few zones midnight does not exist at all
 * (the day then starts at the first moment that is on that date).
 */
export const startOfDay = (date: PlainDate, timeZone: TimeZoneId): Instant => {
    const utcMidnight = utcMidnightOf(date)
    const offsetAt = (at: number): number =>
        utcOffsetMinutes(instant(at), timeZone) * MINUTE_MS

    // Local midnight is UTC midnight minus the zone's offset; the offset is
    // read at the first estimate, which settles a change in between.
    const estimate = utcMidnight - offsetAt(utcMidnight - offsetAt(utcMidnight))
    const isFirstInstantOfDay = (at: number): boolean =>
        toPlainDate(instant(at), timeZone) === date &&
        toPlainDate(instant(at - 1), timeZone) < date
    if (isFirstInstantOfDay(estimate)) return instant(estimate)

    // Rare fallback: bisect for the first instant on `date` or later. A local
    // midnight is never more than 14 hours before or 12 after UTC midnight.
    let low = utcMidnight - 14 * HOUR_MS
    let high = utcMidnight + 12 * HOUR_MS
    while (low < high) {
        const middle = Math.floor((low + high) / 2)
        if (toPlainDate(instant(middle), timeZone) < date) low = middle + 1
        else high = middle
    }
    return instant(low)
}
