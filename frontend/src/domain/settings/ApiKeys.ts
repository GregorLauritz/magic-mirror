/** User-supplied credentials for third-party APIs. */
export interface ApiKeys {
    readonly geocodeApiKey: string
}

export const EMPTY_API_KEYS: ApiKeys = { geocodeApiKey: '' }

export const apiKeysEqual = (a: ApiKeys, b: ApiKeys): boolean =>
    a.geocodeApiKey === b.geocodeApiKey
