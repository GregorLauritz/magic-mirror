import type { AppLifecycle } from '@/application/ports/AppLifecycle'
import type { KeyValueStore } from '@/application/ports/KeyValueStore'

export type ResetLocalData = () => Promise<void>

interface Dependencies {
    /** Every storage the app writes to (local and session). */
    readonly stores: readonly KeyValueStore[]
    /** Only keys with this prefix belong to the app. */
    readonly prefix: string
    /** Re-read in-memory state from the (now empty) storage. */
    readonly reload: ReadonlyArray<() => void>
    readonly clearCache: () => void
    readonly lifecycle: AppLifecycle
}

/**
 * "Clear local data": removes everything the app stored, in every storage
 * (including the Google token, which lives in the session storage), forgets the
 * cached server data, and restarts the app. Keys of other apps are left alone.
 */
export const createResetLocalData =
    ({
        stores,
        prefix,
        reload,
        clearCache,
        lifecycle,
    }: Dependencies): ResetLocalData =>
    async () => {
        for (const store of stores) {
            for (const key of store.keys()) {
                if (key.startsWith(prefix)) store.remove(key)
            }
        }
        for (const refresh of reload) refresh()
        clearCache()
        lifecycle.reload()
    }
