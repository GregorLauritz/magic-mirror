import type { UserSettings } from '@/domain/settings/UserSettings'

export interface SettingsRepository {
    /** Never throws: unreadable data yields the empty settings. */
    load(): UserSettings
    /** False when the settings could not be persisted. */
    save(settings: UserSettings): boolean
    clear(): void
}
