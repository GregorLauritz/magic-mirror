import type {
    GeocodeError,
    GeocodingProvider,
} from '@/application/ports/GeocodingProvider'
import { singleFlight } from '@/application/support/singleFlight'
import { err, ok, type Result } from '@/domain/shared/Result'
import {
    settingsEqual,
    settingsFromInput,
    validateSettingsInput,
    type FieldErrors,
} from '@/domain/settings/settingsRules'
import type { SettingsInput } from '@/domain/settings/UserSettings'
import type { ApiKeyStore } from './ApiKeyStore'
import type { SettingsStore } from './SettingsStore'

export type SaveError =
    | { readonly kind: 'validation'; readonly fields: FieldErrors }
    | { readonly kind: 'geocode-failed'; readonly reason: GeocodeError }
    | { readonly kind: 'storage-failed' }

export type SaveOutcome = 'saved' | 'unchanged'

export type SaveSettings = (
    input: SettingsInput
) => Promise<Result<SaveOutcome, SaveError>>

interface Dependencies {
    readonly settings: SettingsStore
    readonly apiKeys: ApiKeyStore
    readonly geocoding: GeocodingProvider
}

/**
 * Saves the settings form: validate, skip if nothing changed, check that the
 * address can be located with the key being saved, then persist the key and the
 * settings together. If the settings cannot be persisted the key (and the
 * session state) are rolled back, so a half-saved form never survives. Failures
 * are values, so a storage failure is never reported as a geocoding failure.
 */
export const createSaveSettings = ({
    settings,
    apiKeys,
    geocoding,
}: Dependencies): SaveSettings =>
    singleFlight(async (input) => {
        const validated = validateSettingsInput(input)
        if (!validated.ok)
            return err({ kind: 'validation', fields: validated.error })
        const form = validated.value

        const previousSettings = settings.getSnapshot()
        const previousKeys = apiKeys.getSnapshot()
        const next = settingsFromInput(form, previousSettings)
        if (
            settingsEqual(next, previousSettings) &&
            previousKeys.geocodeApiKey === form.geocodeApiKey
        ) {
            return ok('unchanged')
        }

        const located = await geocoding.geocode(
            form.address,
            form.geocodeApiKey
        )
        if (!located.ok)
            return err({ kind: 'geocode-failed', reason: located.error })

        const keyPersisted = apiKeys.set({ geocodeApiKey: form.geocodeApiKey })
        if (!keyPersisted || !settings.replace(next).ok) {
            apiKeys.set(previousKeys)
            settings.replace(previousSettings)
            return err({ kind: 'storage-failed' })
        }
        return ok('saved')
    })
