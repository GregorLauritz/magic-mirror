import type { TimeZoneId } from '@/domain/shared/time'

// Query keys of the calendar feature, without the 'google' prefix that
// useAuthenticatedQuery adds (see googleQueryKey).
export const calendarKeys = {
    events: (calendarId: string, timeZone: TimeZoneId, days: number) =>
        ['calendar', 'events', calendarId, timeZone, days] as const,
    birthdays: (calendarId: string, limit: number) =>
        ['calendar', 'birthdays', calendarId, limit] as const,
    list: () => ['calendar', 'list'] as const,
}
