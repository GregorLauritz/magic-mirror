import type { Address } from '@/domain/location/Address'

export interface StationRef {
    readonly id: string
    readonly name: string
}

/** A train connection the user wants on the dashboard. */
export interface SavedRoute {
    readonly id: string
    readonly from: StationRef
    readonly to: StationRef
}

export type TrainDisplayMode = 'carousel' | 'multiple'

export interface TrainDisplaySettings {
    readonly mode: TrainDisplayMode
    readonly carouselIntervalSeconds: number
}

/** Where a widget sits in the dashboard grid. */
export interface WidgetPlacement {
    readonly widgetId: string
    readonly x: number
    readonly y: number
    readonly w: number
    readonly h: number
}

export interface UserSettings {
    /** Undefined until a country was saved. */
    readonly address?: Address
    /** Undefined until saved; an empty string counts as "not chosen". */
    readonly eventsCalendarId?: string
    readonly birthdayCalendarId?: string
    readonly trainRoutes: readonly SavedRoute[]
    readonly trainDisplay: TrainDisplaySettings
    /** Undefined means "the default layout". */
    readonly layout?: readonly WidgetPlacement[]
}

export const DEFAULT_TRAIN_DISPLAY: TrainDisplaySettings = {
    mode: 'carousel',
    carouselIntervalSeconds: 15,
}

export const EMPTY_SETTINGS: UserSettings = {
    trainRoutes: [],
    trainDisplay: DEFAULT_TRAIN_DISPLAY,
}

/** What the settings form submits (the layout is not part of the form). */
export interface SettingsInput {
    readonly address: Address
    readonly eventsCalendarId: string
    readonly birthdayCalendarId: string
    readonly trainRoutes: readonly SavedRoute[]
    readonly trainDisplay: TrainDisplaySettings
    readonly geocodeApiKey: string
}
