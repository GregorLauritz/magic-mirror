import { err, ok, type Result } from '@/domain/shared/Result'
import type { Address } from '@/domain/location/Address'
import {
    type SavedRoute,
    type SettingsInput,
    type UserSettings,
} from './UserSettings'

/** How many train connections the dashboard can show. */
export const MAX_TRAIN_ROUTES = 5

const MIN_CAROUSEL_SECONDS = 5
const DEFAULT_CAROUSEL_SECONDS = 15

/** Whole seconds, at least 5; anything unusable (empty, "abc", 0) is 15. */
export const clampCarouselInterval = (raw: string | number): number => {
    const parsed =
        typeof raw === 'number' ? Math.trunc(raw) : Number.parseInt(raw, 10)
    return Math.max(MIN_CAROUSEL_SECONDS, parsed || DEFAULT_CAROUSEL_SECONDS)
}

const filled = (value: string): boolean => value.trim() !== ''

/** Routes without both stations cannot be shown, so they are not saved. */
export const dropIncompleteRoutes = (
    routes: readonly SavedRoute[]
): SavedRoute[] =>
    routes.filter((route) => filled(route.from.id) && filled(route.to.id))

// A fixed-order projection, so equality is a plain comparison of what matters
// (and an absent field equals an undefined one).
const project = (s: UserSettings) =>
    JSON.stringify({
        address: s.address && [
            s.address.country,
            s.address.city,
            s.address.postalCode,
        ],
        events: s.eventsCalendarId,
        birthdays: s.birthdayCalendarId,
        routes: s.trainRoutes.map((r) => [
            r.id,
            r.from.id,
            r.from.name,
            r.to.id,
            r.to.name,
        ]),
        display: [s.trainDisplay.mode, s.trainDisplay.carouselIntervalSeconds],
        layout: s.layout?.map((p) => [p.widgetId, p.x, p.y, p.w, p.h]),
    })

export const settingsEqual = (a: UserSettings, b: UserSettings): boolean =>
    a === b || project(a) === project(b)

export type SettingsField =
    | 'country'
    | 'city'
    | 'eventsCalendarId'
    | 'birthdayCalendarId'
    | 'geocodeApiKey'

export type FieldError = 'required' | 'address-incomplete'

export type FieldErrors = Partial<Record<SettingsField, FieldError>>

const trimAddress = (address: Address): Address => ({
    country: address.country.trim(),
    city: address.city.trim(),
    postalCode: address.postalCode.trim(),
})

/**
 * Checks a submitted form and returns it normalised (text trimmed). Every
 * problem is reported, not just the first. A country alone is not enough of an
 * address: a city or a postal code is needed to find a place.
 */
export const validateSettingsInput = (
    input: SettingsInput
): Result<SettingsInput, FieldErrors> => {
    const address = trimAddress(input.address)
    const value: SettingsInput = {
        ...input,
        address,
        eventsCalendarId: input.eventsCalendarId.trim(),
        birthdayCalendarId: input.birthdayCalendarId.trim(),
        geocodeApiKey: input.geocodeApiKey.trim(),
    }

    const errors: FieldErrors = {}
    if (address.country === '') errors.country = 'required'
    else if (address.city === '' && address.postalCode === '')
        errors.city = 'address-incomplete'
    if (value.birthdayCalendarId === '') errors.birthdayCalendarId = 'required'
    if (value.eventsCalendarId === '') errors.eventsCalendarId = 'required'
    if (value.geocodeApiKey === '') errors.geocodeApiKey = 'required'

    return Object.keys(errors).length === 0 ? ok(value) : err(errors)
}

/** The settings after saving the form: the form's fields replace theirs, the layout stays. */
export const settingsFromInput = (
    input: SettingsInput,
    current: UserSettings
): UserSettings => ({
    ...current,
    address: input.address,
    eventsCalendarId: input.eventsCalendarId,
    birthdayCalendarId: input.birthdayCalendarId,
    trainRoutes: dropIncompleteRoutes(input.trainRoutes),
    trainDisplay: {
        mode: input.trainDisplay.mode,
        carouselIntervalSeconds: clampCarouselInterval(
            input.trainDisplay.carouselIntervalSeconds
        ),
    },
})
