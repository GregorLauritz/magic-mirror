import { ProviderResponseError } from '@/application/ports/errors'
import type { Birthday } from '@/domain/calendar/Birthday'
import { stripBirthdaySuffix } from '@/domain/calendar/birthdayRules'
import type {
    CalendarEvent,
    CalendarInfo,
    EventSpan,
} from '@/domain/calendar/CalendarEvent'
import {
    addDays,
    instant,
    plainDate,
    type PlainDate,
} from '@/domain/shared/time'

// Maps Google Calendar API v3 responses to domain objects. An entry that
// cannot be understood is dropped instead of failing the whole list; only a
// response that is not a list at all is an error.

type Json = Readonly<Record<string, unknown>>

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const items = (payload: unknown, what: string): readonly Json[] => {
    if (!isRecord(payload)) {
        throw new ProviderResponseError(
            `Google Calendar ${what}: response is not an object`
        )
    }
    if (payload.items === undefined) return []
    if (!Array.isArray(payload.items)) {
        throw new ProviderResponseError(
            `Google Calendar ${what}: "items" is not a list`
        )
    }
    return payload.items.filter(isRecord)
}

const text = (value: unknown): string =>
    typeof value === 'string' ? value : ''

const asPlainDate = (value: unknown): PlainDate | undefined => {
    if (typeof value !== 'string') return undefined
    try {
        return plainDate(value)
    } catch {
        return undefined
    }
}

const asInstant = (value: unknown) => {
    if (typeof value !== 'string') return undefined
    const epochMs = Date.parse(value)
    return Number.isNaN(epochMs) ? undefined : instant(epochMs)
}

const spanOf = (event: Json): EventSpan | undefined => {
    const start = isRecord(event.start) ? event.start : {}
    const end = isRecord(event.end) ? event.end : {}

    // Google tells all-day events apart by `date` (versus `dateTime`); the
    // length of the event says nothing about it.
    const startDate = asPlainDate(start.date)
    if (startDate !== undefined) {
        const endDate = asPlainDate(end.date)
        return {
            kind: 'all-day',
            start: startDate,
            endExclusive:
                endDate !== undefined && endDate > startDate
                    ? endDate
                    : addDays(startDate, 1),
        }
    }

    const startMoment = asInstant(start.dateTime)
    const endMoment = asInstant(end.dateTime)
    if (startMoment === undefined || endMoment === undefined) return undefined
    return { kind: 'timed', start: startMoment, end: endMoment }
}

export const mapEvents = (payload: unknown): CalendarEvent[] =>
    items(payload, 'events').flatMap((event) => {
        const span = spanOf(event)
        return span === undefined
            ? []
            : [
                  {
                      title: text(event.summary),
                      description: text(event.description),
                      location: text(event.location),
                      span,
                  },
              ]
    })

export const mapBirthdays = (payload: unknown): Birthday[] =>
    items(payload, 'birthdays').flatMap((event) => {
        const date = isRecord(event.start)
            ? asPlainDate(event.start.date)
            : undefined
        return date === undefined
            ? []
            : [{ name: stripBirthdaySuffix(text(event.summary)), date }]
    })

export const mapCalendarList = (payload: unknown): CalendarInfo[] =>
    items(payload, 'calendar list').flatMap((entry) =>
        typeof entry.id === 'string' && entry.id !== ''
            ? [
                  {
                      name: text(entry.summary),
                      id: entry.id,
                      primary: entry.primary === true,
                  },
              ]
            : []
    )
