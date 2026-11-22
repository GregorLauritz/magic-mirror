/** Synchronous string storage (localStorage, sessionStorage, ...). Never throws. */
export interface KeyValueStore {
    get(key: string): string | null
    /** False when the value could not be stored (full or disabled storage). */
    set(key: string, value: string): boolean
    remove(key: string): void
    keys(): readonly string[]
}
