// localStorage can throw (private browsing, quota exceeded, disabled storage),
// so reads/writes degrade to a no-op/undefined rather than crashing the app.

export const getItem = <T>(key: string): T | undefined => {
    try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) return undefined
        return JSON.parse(raw) as T
    } catch {
        return undefined
    }
}

export const setItem = <T>(key: string, value: T): boolean => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
        return true
    } catch {
        return false
    }
}

const APP_STORAGE_PREFIX = 'magic-mirror.'

// Removes every localStorage entry this app has written (settings, API keys,
// etc.), used by the "clear all local data" account-reset flow.
export const clearAllAppData = (): void => {
    try {
        const keysToRemove: string[] = []
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i)
            if (key?.startsWith(APP_STORAGE_PREFIX)) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key))
    } catch {
        // ignore
    }
}
