import type { SaveError } from '@/application/settings/saveSettings'
import type {
    FieldErrors,
    SettingsField,
} from '@/domain/settings/settingsRules'

export type FieldMessages = Partial<Record<SettingsField, string>>

const FIELD_MESSAGES: Record<SettingsField, string> = {
    country: 'Country must not be empty!',
    city: 'Please enter a city or a postal code!',
    eventsCalendarId: 'Events Calendar must not be empty!',
    birthdayCalendarId: 'Birthday Calendar must not be empty!',
    geocodeApiKey: 'Geocode Maps API Key must not be empty!',
}

/** The text to show next to each field that has a problem. */
export const describeFieldErrors = (errors: FieldErrors): FieldMessages => {
    const messages: FieldMessages = {}
    for (const field of Object.keys(errors) as SettingsField[]) {
        messages[field] = FIELD_MESSAGES[field]
    }
    return messages
}

type SaveFailure = Exclude<SaveError, { kind: 'validation' }>

/** The text for a save that was refused after the form was accepted. */
export const describeSaveFailure = (failure: SaveFailure): string => {
    if (failure.kind === 'storage-failed') {
        return 'Your settings could not be saved. The browser storage may be full or disabled.'
    }
    switch (failure.reason) {
        case 'not-found':
            return 'Address could not be geolocated!'
        case 'unauthorized':
            return 'The Geocode Maps API key was rejected. Please check it.'
        case 'network':
            return 'The location service could not be reached. Please try again.'
        case 'invalid-response':
            return 'The location service returned an unexpected answer.'
    }
}
