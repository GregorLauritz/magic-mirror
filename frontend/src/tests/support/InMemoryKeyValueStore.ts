import type { KeyValueStore } from '@/application/ports/KeyValueStore'

/** KeyValueStore for tests; `failWrites` simulates a full or disabled storage. */
export class InMemoryKeyValueStore implements KeyValueStore {
    private readonly data = new Map<string, string>()
    failWrites = false

    get(key: string): string | null {
        return this.data.get(key) ?? null
    }

    set(key: string, value: string): boolean {
        if (this.failWrites) return false
        this.data.set(key, value)
        return true
    }

    remove(key: string): void {
        this.data.delete(key)
    }

    keys(): readonly string[] {
        return [...this.data.keys()]
    }
}
