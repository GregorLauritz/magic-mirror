import type { Birthday } from '@/domain/calendar/Birthday'
import type {
    CalendarEvent,
    CalendarInfo,
} from '@/domain/calendar/CalendarEvent'
import type { Instant } from '@/domain/shared/time'

export interface EventsQuery {
    readonly calendarId: string
    /** Events that have not ended by this moment. */
    readonly from: Instant
    /** Events that start before this moment; unbounded when absent. */
    readonly to?: Instant
    readonly limit: number
}

export interface BirthdaysQuery {
    readonly calendarId: string
    readonly from: Instant
    readonly limit: number
}

/**
 * The user's calendars. Knows nothing about who is signed in: the adapter is
 * given an HTTP client that authorizes its requests.
 */
export interface CalendarProvider {
    listCalendars(signal?: AbortSignal): Promise<readonly CalendarInfo[]>
    /** Single (not recurring-series) events, ordered by start. */
    getEvents(
        query: EventsQuery,
        signal?: AbortSignal
    ): Promise<readonly CalendarEvent[]>
    getBirthdays(
        query: BirthdaysQuery,
        signal?: AbortSignal
    ): Promise<readonly Birthday[]>
}
