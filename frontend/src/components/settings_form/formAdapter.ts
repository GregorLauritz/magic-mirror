// Transitional adapter between the legacy settings form (flat snake_case train
// connections, one params object) and the domain model. Removed when the form is
// rebuilt on top of the domain types (hexagonal refactor, step S9).
import type { SaveError } from '@/application/settings/saveSettings'
import { DEFAULT_ADDRESS } from '@/domain/location/Address'
import type { SettingsField } from '@/domain/settings/settingsRules'
import type {
    SettingsInput,
    UserSettings,
} from '@/domain/settings/UserSettings'
import type {
    TrainConnection,
    TrainDisplaySettings,
} from '../../models/user_settings'

/** What the form shows when it opens. */
export interface SettingsParams {
    country: string
    city: string
    zipCode: string
    birthdayCalId: string
    eventsCalId: string
    trainConnections?: TrainConnection[]
    trainDisplaySettings?: TrainDisplaySettings
}

export const toFormDefaults = (settings: UserSettings): SettingsParams => {
    // First-time users get a pre-filled address; it is never a saved setting.
    const address = settings.address ?? DEFAULT_ADDRESS
    return {
        country: address.country,
        city: address.city,
        zipCode: address.postalCode,
        birthdayCalId: settings.birthdayCalendarId ?? '',
        eventsCalId: settings.eventsCalendarId ?? '',
        trainConnections: settings.trainRoutes.map((route) => ({
            id: route.id,
            departure_station_id: route.from.id,
            departure_station_name: route.from.name,
            arrival_station_id: route.to.id,
            arrival_station_name: route.to.name,
        })),
        trainDisplaySettings: {
            mode: settings.trainDisplay.mode,
            carousel_interval: settings.trainDisplay.carouselIntervalSeconds,
        },
    }
}

/** What the form currently holds. */
export interface FormValues {
    country: string
    city: string
    zipCode: string
    birthdayCalId: string
    eventsCalId: string
    trainConnections: TrainConnection[]
    trainDisplaySettings: TrainDisplaySettings
}

export const toSettingsInput = (
    form: FormValues,
    geocodeApiKey: string
): SettingsInput => ({
    address: {
        country: form.country,
        city: form.city,
        postalCode: form.zipCode,
    },
    eventsCalendarId: form.eventsCalId,
    birthdayCalendarId: form.birthdayCalId,
    trainRoutes: form.trainConnections.map((connection) => ({
        id: connection.id,
        from: {
            id: connection.departure_station_id,
            name: connection.departure_station_name,
        },
        to: {
            id: connection.arrival_station_id,
            name: connection.arrival_station_name,
        },
    })),
    trainDisplay: {
        mode: form.trainDisplaySettings.mode,
        carouselIntervalSeconds: form.trainDisplaySettings.carousel_interval,
    },
    geocodeApiKey,
})

const FIELD_MESSAGES: Record<SettingsField, string> = {
    country: 'Country must not be empty!',
    city: 'Please enter a city or a postal code!',
    birthdayCalendarId: 'Birthday Calendar must not be empty!',
    eventsCalendarId: 'Events Calendar must not be empty!',
    geocodeApiKey: 'Geocode Maps API Key must not be empty!',
}

const FIELD_ORDER: SettingsField[] = [
    'country',
    'city',
    'birthdayCalendarId',
    'eventsCalendarId',
    'geocodeApiKey',
]

/** The message the form shows (as an alert, until it has proper inline errors). */
export const describeSaveError = (error: SaveError): string => {
    switch (error.kind) {
        case 'validation': {
            const field = FIELD_ORDER.find(
                (name) => error.fields[name] !== undefined
            )
            return field ? FIELD_MESSAGES[field] : 'Please check the form.'
        }
        case 'geocode-failed':
            return 'Address could not be geolocated!'
        case 'storage-failed':
            return 'Your settings could not be saved. The browser storage may be full or disabled.'
    }
}
