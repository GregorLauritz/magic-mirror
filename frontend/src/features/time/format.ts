import {
    zonedParts,
    utcOffsetMinutes,
    type Instant,
    type TimeZoneId,
} from '@/domain/shared/time'
import { parseTime } from '@/shared/lib/formatTime'

export interface ClockDisplay {
    readonly weekday: string
    /** dd.mm.yyyy */
    readonly date: string
    readonly hour: string
    readonly minute: string
    /** Offset from UTC in hours, e.g. "+9", "+5.5", "-3.5" or "0". */
    readonly utcOffset: string
}

export const formatUtcOffset = (offsetMinutes: number): string => {
    const hours = offsetMinutes / 60
    return hours > 0 ? `+${hours}` : String(hours)
}

/** Everything the clock widget shows, for an instant seen in a given zone. */
export const formatClock = (
    at: Instant,
    timeZone: TimeZoneId,
    locale: string
): ClockDisplay => {
    const parts = zonedParts(at, timeZone)
    return {
        weekday: new Intl.DateTimeFormat(locale, {
            weekday: 'long',
            timeZone,
        }).format(at),
        date: `${parseTime(parts.day)}.${parseTime(parts.month)}.${parts.year}`,
        hour: parseTime(parts.hour),
        minute: parseTime(parts.minute),
        utcOffset: formatUtcOffset(utcOffsetMinutes(at, timeZone)),
    }
}
