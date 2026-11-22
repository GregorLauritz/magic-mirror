import { DEFAULT_ADDRESS } from '@/domain/location/Address'
import type { ApiKeys } from '@/domain/settings/ApiKeys'
import {
    clampCarouselInterval,
    MAX_TRAIN_ROUTES,
} from '@/domain/settings/settingsRules'
import type {
    SavedRoute,
    SettingsInput,
    TrainDisplayMode,
    UserSettings,
} from '@/domain/settings/UserSettings'

/** What the form holds while the user edits it. Nothing here is saved yet. */
export interface FormState {
    readonly country: string
    readonly city: string
    readonly postalCode: string
    readonly eventsCalendarId: string
    readonly birthdayCalendarId: string
    readonly geocodeApiKey: string
    readonly trainRoutes: readonly SavedRoute[]
    readonly trainMode: TrainDisplayMode
    /** Text, because it is being typed; turned into seconds when the field is left. */
    readonly carouselIntervalText: string
}

export type TextField =
    | 'country'
    | 'city'
    | 'postalCode'
    | 'eventsCalendarId'
    | 'birthdayCalendarId'
    | 'geocodeApiKey'
    | 'carouselIntervalText'

export type FormAction =
    | {
          readonly type: 'text'
          readonly field: TextField
          readonly value: string
      }
    | { readonly type: 'trainMode'; readonly mode: TrainDisplayMode }
    | { readonly type: 'addRoute'; readonly id: string }
    | { readonly type: 'removeRoute'; readonly id: string }
    | { readonly type: 'updateRoute'; readonly route: SavedRoute }
    | { readonly type: 'commitInterval' }

const DEFAULT_CALENDAR_ID = 'primary'

const orPrimary = (id: string | undefined): string =>
    id !== undefined && id.trim() !== '' ? id : DEFAULT_CALENDAR_ID

export const initialFormState = (
    settings: UserSettings,
    apiKeys: ApiKeys
): FormState => {
    // A first-time user gets an example address to overwrite; it is only
    // shown, never saved unless they save it.
    const address = settings.address ?? DEFAULT_ADDRESS
    return {
        country: address.country,
        city: address.city,
        postalCode: address.postalCode,
        eventsCalendarId: orPrimary(settings.eventsCalendarId),
        birthdayCalendarId: orPrimary(settings.birthdayCalendarId),
        geocodeApiKey: apiKeys.geocodeApiKey,
        trainRoutes: settings.trainRoutes,
        trainMode: settings.trainDisplay.mode,
        carouselIntervalText: String(
            settings.trainDisplay.carouselIntervalSeconds
        ),
    }
}

const emptyRoute = (id: string): SavedRoute => ({
    id,
    from: { id: '', name: '' },
    to: { id: '', name: '' },
})

const hasRoute = (state: FormState, id: string): boolean =>
    state.trainRoutes.some((route) => route.id === id)

export const formReducer = (
    state: FormState,
    action: FormAction
): FormState => {
    switch (action.type) {
        case 'text':
            return { ...state, [action.field]: action.value }
        case 'trainMode':
            return { ...state, trainMode: action.mode }
        case 'addRoute':
            return state.trainRoutes.length >= MAX_TRAIN_ROUTES
                ? state
                : {
                      ...state,
                      trainRoutes: [
                          ...state.trainRoutes,
                          emptyRoute(action.id),
                      ],
                  }
        case 'removeRoute':
            return !hasRoute(state, action.id)
                ? state
                : {
                      ...state,
                      trainRoutes: state.trainRoutes.filter(
                          (route) => route.id !== action.id
                      ),
                  }
        case 'updateRoute':
            return !hasRoute(state, action.route.id)
                ? state
                : {
                      ...state,
                      trainRoutes: state.trainRoutes.map((route) =>
                          route.id === action.route.id ? action.route : route
                      ),
                  }
        case 'commitInterval':
            return {
                ...state,
                carouselIntervalText: String(
                    clampCarouselInterval(state.carouselIntervalText)
                ),
            }
    }
}

/** What the form submits. */
export const toSettingsInput = (state: FormState): SettingsInput => ({
    address: {
        country: state.country,
        city: state.city,
        postalCode: state.postalCode,
    },
    eventsCalendarId: state.eventsCalendarId,
    birthdayCalendarId: state.birthdayCalendarId,
    trainRoutes: state.trainRoutes,
    trainDisplay: {
        mode: state.trainMode,
        carouselIntervalSeconds: clampCarouselInterval(
            state.carouselIntervalText
        ),
    },
    geocodeApiKey: state.geocodeApiKey,
})
