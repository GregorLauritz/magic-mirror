export type EventList = {
    count: number
    list: Array<EventItem>
}

export type EventItem = {
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
