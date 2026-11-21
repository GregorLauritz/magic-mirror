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
