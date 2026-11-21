import { useServices } from '@/app/services/useServices'
import type { CalendarInfo } from '@/domain/calendar/CalendarEvent'
import { useAuthenticatedQuery } from '@/features/auth'
import { calendarKeys } from '../calendarKeys'
import { CALENDAR_LIST_STALE_MS } from '../constants'

const NONE: readonly CalendarInfo[] = []

export interface CalendarListState {
    /** Empty until loaded, or while signed out: ready for a picker. */
    readonly calendars: readonly CalendarInfo[]
    readonly isLoading: boolean
    readonly isError: boolean
}

/** The signed-in user's calendars, for choosing which ones to show. */
export const useCalendarList = ({
    enabled = true,
}: { readonly enabled?: boolean } = {}): CalendarListState => {
    const { calendar } = useServices()
    const query = useAuthenticatedQuery(
        calendarKeys.list(),
        ({ signal }) => calendar.listCalendars(signal),
        { enabled, staleTimeMs: CALENDAR_LIST_STALE_MS }
    )
    return {
        calendars: query.data ?? NONE,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}
