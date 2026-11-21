import type { KeyValueStore } from '@/application/ports/KeyValueStore'
import type { SettingsRepository } from '@/application/ports/SettingsRepository'
import type { UserSettings } from '@/domain/settings/UserSettings'
import { fromPersisted, toPersisted } from './settingsDto'
import { STORAGE_KEYS } from './storageKeys'

const readJson = (raw: string | null): unknown => {
    if (raw === null) return undefined
    try {
        return JSON.parse(raw)
    } catch {
        return undefined
    }
}

export class LocalStorageSettingsRepository implements SettingsRepository {
    constructor(private readonly store: KeyValueStore) {}

    load(): UserSettings {
        return fromPersisted(
            readJson(this.store.get(STORAGE_KEYS.userSettings))
        )
    }

    save(settings: UserSettings): boolean {
        const previous = readJson(this.store.get(STORAGE_KEYS.userSettings))
        return this.store.set(
            STORAGE_KEYS.userSettings,
            JSON.stringify(toPersisted(settings, previous))
        )
    }

    clear(): void {
        this.store.remove(STORAGE_KEYS.userSettings)
    }
}
