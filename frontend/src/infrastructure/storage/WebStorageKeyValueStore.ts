import type { KeyValueStore } from '@/application/ports/KeyValueStore'

/**
 * KeyValueStore over a Web Storage object. Storage can throw at any point
 * (private browsing, quota, blocked cookies - even just reading
 * `window.localStorage`), so every call degrades to "nothing there" / "not
 * saved" instead of crashing the app.
 */
export class WebStorageKeyValueStore implements KeyValueStore {
    constructor(private readonly getStorage: () => Storage) {}

    get(key: string): string | null {
        try {
            return this.getStorage().getItem(key)
        } catch {
            return null
        }
    }

    set(key: string, value: string): boolean {
        try {
            this.getStorage().setItem(key, value)
            return true
        } catch {
            return false
        }
    }

    remove(key: string): void {
        try {
            this.getStorage().removeItem(key)
        } catch {
            // nothing to remove from an unavailable storage
        }
    }

    keys(): readonly string[] {
        try {
            const storage = this.getStorage()
            const keys: string[] = []
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i)
                if (key !== null) keys.push(key)
            }
            return keys
        } catch {
            return []
        }
    }
}
