import type { ApiKeyRepository } from '@/application/ports/ApiKeyRepository'
import type { ObservableStore } from '@/application/ports/Store'
import { createStore, type Store } from '@/application/support/createStore'
import { apiKeysEqual, type ApiKeys } from '@/domain/settings/ApiKeys'

/** The API keys as observable state, persisted through a repository. */
export class ApiKeyStore implements ObservableStore<ApiKeys> {
    private readonly store: Store<ApiKeys>
    readonly getSnapshot: () => ApiKeys
    readonly subscribe: (listener: () => void) => () => void

    constructor(private readonly repository: ApiKeyRepository) {
        this.store = createStore(repository.load(), apiKeysEqual)
        this.getSnapshot = this.store.getSnapshot
        this.subscribe = this.store.subscribe
    }

    /**
     * Merges `partial` into the keys. The session sees the new value even if it
     * cannot be persisted; the return value says whether it was.
     */
    readonly set = (partial: Partial<ApiKeys>): boolean => {
        const next: ApiKeys = { ...this.store.getSnapshot(), ...partial }
        if (apiKeysEqual(next, this.store.getSnapshot())) return true
        this.store.set(next)
        return this.repository.save(next)
    }

    /** Re-reads the persisted keys (e.g. after the storage was cleared). */
    readonly reload = (): void => {
        this.store.set(this.repository.load())
    }
}
