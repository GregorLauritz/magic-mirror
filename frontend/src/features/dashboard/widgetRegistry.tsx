import type { ComponentType } from 'react'
import type { WidgetPlacement } from '@/domain/settings/UserSettings'
import { BirthdaysWidget, UpcomingEventsWidget } from '@/features/calendar'
import { ClockWidget } from '@/features/time'
import { TrainTimesWidget } from '@/features/trains'
import {
    CurrentWeatherWidget,
    DailyForecastWidget,
    HourlyForecastWidget,
} from '@/features/weather'

export interface WidgetDefinition {
    /** Stored in saved layouts: never rename one. */
    readonly id: string
    readonly Component: ComponentType
    /** Where it sits in the default layout. */
    readonly defaultPlacement: Omit<WidgetPlacement, 'widgetId'>
}

/** Every widget of the dashboard: the single place that knows them all. */
export const WIDGETS: readonly WidgetDefinition[] = [
    {
        id: 'time',
        Component: ClockWidget,
        defaultPlacement: { x: 0, y: 0, w: 2, h: 1 },
    },
    {
        id: 'birthdays',
        Component: BirthdaysWidget,
        defaultPlacement: { x: 2, y: 0, w: 2, h: 1 },
    },
    {
        id: 'events',
        Component: UpcomingEventsWidget,
        defaultPlacement: { x: 4, y: 0, w: 4, h: 1 },
    },
    {
        id: 'trains',
        Component: TrainTimesWidget,
        defaultPlacement: { x: 8, y: 0, w: 4, h: 1 },
    },
    {
        id: 'current-weather',
        Component: CurrentWeatherWidget,
        defaultPlacement: { x: 0, y: 1, w: 4, h: 1 },
    },
    {
        id: 'hourly-weather',
        Component: HourlyForecastWidget,
        defaultPlacement: { x: 4, y: 1, w: 4, h: 1 },
    },
    {
        id: 'daily-forecast',
        Component: DailyForecastWidget,
        defaultPlacement: { x: 8, y: 1, w: 4, h: 1 },
    },
]

export const DEFAULT_LAYOUT: readonly WidgetPlacement[] = WIDGETS.map(
    ({ id, defaultPlacement }) => ({ widgetId: id, ...defaultPlacement })
)
