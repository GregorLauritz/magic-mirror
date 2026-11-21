// The keys under which data is persisted in the browser. They are a
// compatibility contract with data saved by earlier versions: never rename them
// and never make them configurable.
export const APP_STORAGE_PREFIX = 'magic-mirror.'

export const STORAGE_KEYS = {
    userSettings: `${APP_STORAGE_PREFIX}user-settings`,
    apiKeys: `${APP_STORAGE_PREFIX}api-keys`,
    googleToken: `${APP_STORAGE_PREFIX}google-token`,
} as const
