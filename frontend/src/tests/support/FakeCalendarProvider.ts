import type {
    BirthdaysQuery,
    CalendarProvider,
    EventsQuery,
} from '@/application/ports/CalendarProvider'
import type { Birthday } from '@/domain/calendar/Birthday'
import type {
    CalendarEvent,
    CalendarInfo,
} from '@/domain/calendar/CalendarEvent'

interface Script {
    events?: readonly CalendarEvent[] | Error
    birthdays?: readonly Birthday[] | Error
    calendars?: readonly CalendarInfo[] | Error
}

/** Scripted CalendarProvider that records its calls. */
export class FakeCalendarProvider implements CalendarProvider {
    readonly eventCalls: EventsQuery[] = []
    readonly birthdayCalls: BirthdaysQuery[] = []
    listCalls = 0
    /** The abort signal of every call, in order. */
    readonly signals: Array<AbortSignal | undefined> = []

    constructor(public script: Script = {}) {}

    async listCalendars(
        signal?: AbortSignal
    ): Promise<readonly CalendarInfo[]> {
        this.listCalls++
        this.signals.push(signal)
        return this.answer(this.script.calendars, 'calendar list')
    }

    async getEvents(
        query: EventsQuery,
        signal?: AbortSignal
    ): Promise<readonly CalendarEvent[]> {
        this.eventCalls.push(query)
        this.signals.push(signal)
        return this.answer(this.script.events, 'events')
    }

    async getBirthdays(
        query: BirthdaysQuery,
        signal?: AbortSignal
    ): Promise<readonly Birthday[]> {
        this.birthdayCalls.push(query)
        this.signals.push(signal)
        return this.answer(this.script.birthdays, 'birthdays')
    }

    private answer<T>(value: T | Error | undefined, what: string): T {
        if (value === undefined) throw new Error(`Unscripted ${what} call`)
        if (value instanceof Error) throw value
        return value
    }
}
