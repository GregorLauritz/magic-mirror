import type { CalendarProvider } from '@/application/ports/CalendarProvider'
import type { Clock } from '@/application/ports/Clock'
import type { Birthday } from '@/domain/calendar/Birthday'
import type {
    CalendarEvent,
    CalendarInfo,
} from '@/domain/calendar/CalendarEvent'
import { addDays, startOfDay, toPlainDate } from '@/domain/shared/time'

/** More than any dashboard shows; keeps one request per range. */
const MAX_EVENTS = 100

export interface CalendarService {
    listCalendars(signal?: AbortSignal): Promise<readonly CalendarInfo[]>
    /** The events from now to the end of the last of `days` days (today counts as the first). */
    getUpcomingEvents(
        request: { readonly calendarId: string; readonly days: number },
        signal?: AbortSignal
    ): Promise<readonly CalendarEvent[]>
    getBirthdays(
        request: { readonly calendarId: string; readonly limit: number },
        signal?: AbortSignal
    ): Promise<readonly Birthday[]>
}

interface Dependencies {
    readonly provider: CalendarProvider
    readonly clock: Clock
}

/**
 * Decides which stretch of time "the next days" means: from now until the end
 * of the last day in the display zone, not in the browser's or UTC.
 */
export const createCalendarService = ({
    provider,
    clock,
}: Dependencies): CalendarService => ({
    listCalendars: (signal) => provider.listCalendars(signal),

    getUpcomingEvents: ({ calendarId, days }, signal) => {
        const timeZone = clock.timeZone()
        const from = clock.now()
        const today = toPlainDate(from, timeZone)
        return provider.getEvents(
            {
                calendarId,
                from,
                to: startOfDay(addDays(today, days), timeZone),
                limit: MAX_EVENTS,
            },
            signal
        )
    },

    getBirthdays: ({ calendarId, limit }, signal) =>
        provider.getBirthdays({ calendarId, from: clock.now(), limit }, signal),
})
