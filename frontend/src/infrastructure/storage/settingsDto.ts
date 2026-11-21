import {
    DEFAULT_TRAIN_DISPLAY,
    EMPTY_SETTINGS,
    type SavedRoute,
    type TrainDisplaySettings,
    type UserSettings,
    type WidgetPlacement,
} from '@/domain/settings/UserSettings'
import { clampCarouselInterval } from '@/domain/settings/settingsRules'

// The persisted shape of `magic-mirror.user-settings`. It is the shape earlier
// versions wrote (snake_case, every field optional because partial blobs exist:
// the dashboard used to write only the layout into a blob with no address), and
// it must stay readable by them, so it is mapped to the domain model here
// instead of being used as the model. Reading never throws; writing merges into
// what is stored so unknown keys survive a rollback.

type Json = Record<string, unknown>

export const CURRENT_SCHEMA_VERSION = 1

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined

const finite = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

export type Migrations = Readonly<Record<number, (raw: Json) => Json>>

/**
 * Brings a stored blob up to the current schema. A blob without a version is
 * version 1 (what every earlier build wrote). A blob from a newer build is read
 * as is, best effort, never rewritten downwards.
 */
export const migrate = (
    raw: Json,
    migrations: Migrations = {},
    current: number = CURRENT_SCHEMA_VERSION
): { raw: Json; from: number } => {
    const from = finite(raw.schema_version) ? raw.schema_version : 1
    let migrated = raw
    for (let version = from; version < current; version++) {
        const step = migrations[version]
        if (step) migrated = step(migrated)
    }
    return { raw: migrated, from }
}

const routesFrom = (value: unknown): SavedRoute[] => {
    if (!Array.isArray(value)) return []
    const routes: SavedRoute[] = []
    for (const entry of value) {
        if (!isRecord(entry)) continue
        const id = text(entry.id)
        const fromId = text(entry.departure_station_id)
        const toId = text(entry.arrival_station_id)
        if (!id || !fromId || !toId) continue
        routes.push({
            id,
            from: {
                id: fromId,
                name: text(entry.departure_station_name) ?? '',
            },
            to: { id: toId, name: text(entry.arrival_station_name) ?? '' },
        })
    }
    return routes
}

const displayFrom = (value: unknown): TrainDisplaySettings => {
    if (!isRecord(value)) return DEFAULT_TRAIN_DISPLAY
    const interval = value.carousel_interval
    return {
        mode: value.mode === 'multiple' ? 'multiple' : 'carousel',
        carouselIntervalSeconds: clampCarouselInterval(
            typeof interval === 'number' || typeof interval === 'string'
                ? interval
                : ''
        ),
    }
}

const layoutFrom = (value: unknown): WidgetPlacement[] | undefined => {
    if (!Array.isArray(value)) return undefined
    const placements: WidgetPlacement[] = []
    for (const entry of value) {
        if (!isRecord(entry)) continue
        const widgetId = text(entry.i)
        const { x, y, w, h } = entry
        if (widgetId && finite(x) && finite(y) && finite(w) && finite(h)) {
            placements.push({ widgetId, x, y, w, h })
        }
    }
    return placements
}

/** Total: any input, however broken, yields valid settings. */
export const fromPersisted = (raw: unknown): UserSettings => {
    if (!isRecord(raw)) return EMPTY_SETTINGS
    const stored = migrate(raw).raw
    const country = text(stored.country)
    return {
        address: country
            ? {
                  country,
                  city: text(stored.city) ?? '',
                  postalCode: text(stored.zip_code) ?? '',
              }
            : undefined,
        eventsCalendarId: text(stored.events_cal_id),
        birthdayCalendarId: text(stored.birthday_cal_id),
        trainRoutes: routesFrom(stored.train_connections),
        trainDisplay: displayFrom(stored.train_display_settings),
        layout: layoutFrom(stored.widget_layout),
    }
}

/** The blob to store: `previous` with the managed fields replaced. */
export const toPersisted = (
    settings: UserSettings,
    previous: unknown
): Json => {
    const previousObject = isRecord(previous) ? previous : {}
    const previousVersion = finite(previousObject.schema_version)
        ? previousObject.schema_version
        : 0
    const blob: Json = {
        ...previousObject,
        schema_version: Math.max(CURRENT_SCHEMA_VERSION, previousVersion),
    }

    // An undefined domain value removes the key, so "no layout" is not stale data.
    const put = (key: string, value: unknown): void => {
        if (value === undefined) delete blob[key]
        else blob[key] = value
    }
    put('country', settings.address?.country)
    put('city', settings.address?.city)
    put('zip_code', settings.address?.postalCode)
    put('events_cal_id', settings.eventsCalendarId)
    put('birthday_cal_id', settings.birthdayCalendarId)
    blob.train_connections = settings.trainRoutes.map((route) => ({
        id: route.id,
        departure_station_id: route.from.id,
        departure_station_name: route.from.name,
        arrival_station_id: route.to.id,
        arrival_station_name: route.to.name,
    }))
    blob.train_display_settings = {
        mode: settings.trainDisplay.mode,
        carousel_interval: settings.trainDisplay.carouselIntervalSeconds,
    }
    put(
        'widget_layout',
        settings.layout?.map((p) => ({
            i: p.widgetId,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
        }))
    )
    return blob
}
