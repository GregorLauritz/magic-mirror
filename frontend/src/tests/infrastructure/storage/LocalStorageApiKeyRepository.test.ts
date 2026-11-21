import { describe, expect, it } from 'vitest'
import { LocalStorageApiKeyRepository } from '@/infrastructure/storage/LocalStorageApiKeyRepository'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'

const setup = (raw?: string) => {
    const store = new InMemoryKeyValueStore()
    if (raw !== undefined) store.set(STORAGE_KEYS.apiKeys, raw)
    return { store, repository: new LocalStorageApiKeyRepository(store) }
}

describe('LocalStorageApiKeyRepository', () => {
    it('reads the persisted key (golden: the exact shape written by earlier versions)', () => {
        const { repository } = setup(
            '{"geocodeApiKey":"k-123","openWeatherMapApiKey":"x"}'
        )

        expect(repository.load()).toEqual({ geocodeApiKey: 'k-123' })
    })

    it('defaults to an empty key when nothing was saved', () => {
        expect(setup().repository.load()).toEqual({ geocodeApiKey: '' })
    })

    it.each([
        ['corrupt JSON', '{not json'],
        ['a JSON string', '"hello"'],
        ['a JSON number', '42'],
        ['null', 'null'],
        ['an array', '[1,2]'],
        ['a non-string key', '{"geocodeApiKey":123}'],
    ])('falls back to defaults for %s', (_label, raw) => {
        expect(setup(raw).repository.load()).toEqual({ geocodeApiKey: '' })
    })

    it('writes the key and keeps what it does not manage (openWeatherMapApiKey, unknown keys)', () => {
        const { store, repository } = setup(
            '{"geocodeApiKey":"old","openWeatherMapApiKey":"keep-me","future":true}'
        )

        expect(repository.save({ geocodeApiKey: 'new' })).toBe(true)

        expect(JSON.parse(store.get(STORAGE_KEYS.apiKeys)!)).toEqual({
            geocodeApiKey: 'new',
            openWeatherMapApiKey: 'keep-me',
            future: true,
        })
    })

    it('writes cleanly over a corrupt value', () => {
        const { store, repository } = setup('{broken')

        expect(repository.save({ geocodeApiKey: 'k' })).toBe(true)

        expect(JSON.parse(store.get(STORAGE_KEYS.apiKeys)!)).toEqual({
            geocodeApiKey: 'k',
        })
    })

    it('reports a failed write instead of throwing', () => {
        const { store, repository } = setup()
        store.failWrites = true

        expect(repository.save({ geocodeApiKey: 'k' })).toBe(false)
    })

    it('uses the storage key of earlier versions', () => {
        expect(STORAGE_KEYS.apiKeys).toBe('magic-mirror.api-keys')
    })

    it('removes its entry on clear', () => {
        const { store, repository } = setup('{"geocodeApiKey":"k"}')

        repository.clear()

        expect(store.get(STORAGE_KEYS.apiKeys)).toBeNull()
    })
})
