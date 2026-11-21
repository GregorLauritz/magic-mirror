import type { CalendarEvent } from '@/domain/calendar/CalendarEvent'
import { instant, plainDate } from '@/domain/shared/time'

const at = (iso: string) => instant(Date.parse(iso))

export const timedEvent = (
    title: string,
    start: string,
    end: string,
    location = ''
): CalendarEvent => ({
    title,
    description: '',
    location,
    span: { kind: 'timed', start: at(start), end: at(end) },
})

export const allDayEvent = (
    title: string,
    start: string,
    endExclusive: string
): CalendarEvent => ({
    title,
    description: '',
    location: '',
    span: {
        kind: 'all-day',
        start: plainDate(start),
        endExclusive: plainDate(endExclusive),
    },
})
