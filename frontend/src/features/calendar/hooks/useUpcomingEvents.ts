import { useServices } from '@/app/services/useServices'
import type { CalendarEvent } from '@/domain/calendar/CalendarEvent'
import { googleQueryKey, useAuthenticatedQuery } from '@/features/auth'
import { useTimeZone, useToday } from '@/features/time'
import { useInvalidateOnChange } from '@/shared/hooks/useInvalidateOnChange'
import { calendarKeys } from '../calendarKeys'
import { PRIMARY_CALENDAR, UPCOMING_EVENT_DAYS } from '../constants'

export interface UpcomingEventsState {
    /** Today and the following days, or undefined until a load succeeded. */
    readonly events: readonly CalendarEvent[] | undefined
    readonly isLoading: boolean
    readonly isError: boolean
}

/**
 * The events of the next days, fetched as one range. A calendar that was never
 * chosen means the user's primary one, as the settings form pre-fills it.
 */
export const useUpcomingEvents = (
    calendarId: string | undefined
): UpcomingEventsState => {
    const { calendar, config } = useServices()
    const timeZone = useTimeZone()
    const id = calendarId?.trim() || PRIMARY_CALENDAR
    const key = calendarKeys.events(id, timeZone, UPCOMING_EVENT_DAYS)

    const query = useAuthenticatedQuery(
        key,
        ({ signal }) =>
            calendar.getUpcomingEvents(
                { calendarId: id, days: UPCOMING_EVENT_DAYS },
                signal
            ),
        { refetchIntervalMs: config.refreshIntervalMs }
    )
    // The range starts at today: after midnight it has to be asked again.
    useInvalidateOnChange(useToday(), googleQueryKey(key))

    return {
        events: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}
