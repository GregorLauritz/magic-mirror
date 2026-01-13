import { WidgetLayout } from '../models/user_settings'

export const DEFAULT_LAYOUT: WidgetLayout[] = [
    { i: 'time', x: 0, y: 0, w: 2, h: 1 },
    { i: 'birthdays', x: 2, y: 0, w: 2, h: 1 },
    { i: 'events', x: 4, y: 0, w: 4, h: 1 },
    { i: 'trains', x: 8, y: 0, w: 4, h: 1 },
    { i: 'current-weather', x: 0, y: 1, w: 4, h: 1 },
    { i: 'hourly-weather', x: 4, y: 1, w: 4, h: 1 },
    { i: 'daily-forecast', x: 8, y: 1, w: 4, h: 1 },
]
