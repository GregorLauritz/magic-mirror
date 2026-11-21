import { describe, expect, it } from 'vitest'
import { EMPTY_SETTINGS } from '@/domain/settings/UserSettings'
import { LocalStorageSettingsRepository } from '@/infrastructure/storage/LocalStorageSettingsRepository'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { FULL_DOMAIN, FULL_RAW } from './legacyFixtures'

const setup = (raw?: string) => {
    const store = new InMemoryKeyValueStore()
    if (raw !== undefined) store.set(STORAGE_KEYS.userSettings, raw)
    return { store, repository: new LocalStorageSettingsRepository(store) }
}

describe('LocalStorageSettingsRepository', () => {
    it('uses the storage key of earlier versions', () => {
        expect(STORAGE_KEYS.userSettings).toBe('magic-mirror.user-settings')
    })

    it('loads what an earlier version saved', () => {
        const { repository } = setup(JSON.stringify(FULL_RAW))

        expect(repository.load()).toEqual(FULL_DOMAIN)
    })

    it('loads the empty settings when nothing was saved', () => {
        expect(setup().repository.load()).toEqual(EMPTY_SETTINGS)
    })

    it.each(['{not json', '"text"', 'null', '[1]', '42'])(
        'never throws on the unreadable value %s',
        (raw) => {
            expect(setup(raw).repository.load()).toEqual(EMPTY_SETTINGS)
        }
    )

    it('saves in the legacy shape, merged into what is stored, with a schema version', () => {
        const { store, repository } = setup(
            JSON.stringify({ ...FULL_RAW, future_feature: true })
        )

        const saved = repository.save({
            ...FULL_DOMAIN,
            address: { country: 'AT', city: 'Wien', postalCode: '1010' },
        } as never)

        const stored = JSON.parse(store.get(STORAGE_KEYS.userSettings)!)
        expect(saved).toBe(true)
        expect(stored).toMatchObject({
            country: 'AT',
            city: 'Wien',
            zip_code: '1010',
            future_feature: true,
            schema_version: 1,
        })
    })

    it('reports a failed write instead of throwing', () => {
        const { store, repository } = setup()
        store.failWrites = true

        expect(repository.save(EMPTY_SETTINGS)).toBe(false)
    })

    it('removes its entry on clear', () => {
        const { store, repository } = setup(JSON.stringify(FULL_RAW))

        repository.clear()

        expect(store.get(STORAGE_KEYS.userSettings)).toBeNull()
    })
})
