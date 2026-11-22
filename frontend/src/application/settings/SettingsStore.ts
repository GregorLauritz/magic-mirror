import type { ObservableStore } from '@/application/ports/Store'
import type { SettingsRepository } from '@/application/ports/SettingsRepository'
import { createStore, type Store } from '@/application/support/createStore'
import { err, ok, type Result } from '@/domain/shared/Result'
import { settingsEqual } from '@/domain/settings/settingsRules'
import type { UserSettings } from '@/domain/settings/UserSettings'

/**
 * The user's settings as observable state, persisted through a repository.
 *
 * A change that leaves the settings equal keeps the same snapshot, and parts
 * the change did not touch keep their references, so a component that selects
 * one field is not re-rendered by a change to another.
 */
export class SettingsStore implements ObservableStore<UserSettings> {
    private readonly store: Store<UserSettings>
    readonly getSnapshot: () => UserSettings
    readonly subscribe: (listener: () => void) => () => void

    constructor(private readonly repository: SettingsRepository) {
        this.store = createStore(repository.load(), settingsEqual)
        this.getSnapshot = this.store.getSnapshot
        this.subscribe = this.store.subscribe
    }

    /** Merges `partial`; a key set to undefined clears that field. */
    readonly patch = (
        partial: Partial<UserSettings>
    ): Result<UserSettings, 'storage-unavailable'> =>
        this.apply({ ...this.store.getSnapshot(), ...partial })

    readonly replace = (
        next: UserSettings
    ): Result<UserSettings, 'storage-unavailable'> => this.apply(next)

    /** Re-reads the persisted settings (e.g. after the storage was cleared). */
    readonly reload = (): void => {
        this.store.set(this.repository.load())
    }

    // The session sees the new value even if it cannot be persisted; the
    // result says whether it was.
    private apply(
        next: UserSettings
    ): Result<UserSettings, 'storage-unavailable'> {
        const current = this.store.getSnapshot()
        if (settingsEqual(next, current)) return ok(current)
        this.store.set(next)
        return this.repository.save(next)
            ? ok(next)
            : err('storage-unavailable')
    }
}
