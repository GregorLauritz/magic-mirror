export type CalendarEventList = {
    count: number
    list: Array<CalendarEvent>
}

export type CalendarEvent = {
    summary: string
    description: string
    location: string
    start: string
    end: string
    allDay: boolean
    multiDays: boolean
    merged?: boolean
}

export type CalendarListItem = { name: string; id: string; primary: boolean }
