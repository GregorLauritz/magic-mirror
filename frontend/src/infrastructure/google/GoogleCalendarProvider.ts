import type {
    BirthdaysQuery,
    CalendarProvider,
    EventsQuery,
} from '@/application/ports/CalendarProvider'
import type { HttpClient } from '@/application/ports/HttpClient'
import type { Birthday } from '@/domain/calendar/Birthday'
import type {
    CalendarEvent,
    CalendarInfo,
} from '@/domain/calendar/CalendarEvent'
import type { Instant } from '@/domain/shared/time'
import {
    mapBirthdays,
    mapCalendarList,
    mapEvents,
} from './googleCalendarMapper'

const CALENDAR_LIST_LIMIT = 100

const iso = (at: Instant): string => new Date(at).toISOString()

/**
 * Google Calendar API v3. The HttpClient it is given adds the user's access
 * token, so this adapter only knows URLs and answers.
 */
export class GoogleCalendarProvider implements CalendarProvider {
    constructor(
        private readonly http: HttpClient,
        private readonly baseUrl: string
    ) {}

    async listCalendars(
        signal?: AbortSignal
    ): Promise<readonly CalendarInfo[]> {
        const url = `${this.baseUrl}/users/me/calendarList?${new URLSearchParams(
            { maxResults: String(CALENDAR_LIST_LIMIT) }
        )}`
        return mapCalendarList(await this.http.getJson({ url, signal }))
    }

    async getEvents(
        { calendarId, from, to, limit }: EventsQuery,
        signal?: AbortSignal
    ): Promise<readonly CalendarEvent[]> {
        const url = this.eventsUrl(calendarId, from, to, limit)
        return mapEvents(await this.http.getJson({ url, signal }))
    }

    async getBirthdays(
        { calendarId, from, limit }: BirthdaysQuery,
        signal?: AbortSignal
    ): Promise<readonly Birthday[]> {
        const url = this.eventsUrl(calendarId, from, undefined, limit)
        return mapBirthdays(await this.http.getJson({ url, signal }))
    }

    private eventsUrl(
        calendarId: string,
        from: Instant,
        to: Instant | undefined,
        limit: number
    ): string {
        const params = new URLSearchParams({
            timeMin: iso(from),
            maxResults: String(limit),
            singleEvents: 'true',
            orderBy: 'startTime',
        })
        if (to !== undefined) params.set('timeMax', iso(to))
        return `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    }
}
