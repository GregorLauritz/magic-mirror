import { describe, expect, it, vi } from 'vitest'
import type { SettingsRepository } from '@/application/ports/SettingsRepository'
import { SettingsStore } from '@/application/settings/SettingsStore'
import {
    EMPTY_SETTINGS,
    type UserSettings,
} from '@/domain/settings/UserSettings'

const ADDRESS = { country: 'DE', city: 'Stuttgart', postalCode: '70176' }

const repositoryWith = (
    initial: UserSettings,
    save: (s: UserSettings) => boolean = () => true
): SettingsRepository & { stored: UserSettings } => {
    const repository: SettingsRepository & { stored: UserSettings } = {
        stored: initial,
        load: vi.fn(() => repository.stored),
        save: vi.fn((s: UserSettings) => {
            const persisted = save(s)
            if (persisted) repository.stored = s
            return persisted
        }),
        clear: vi.fn(),
    }
    return repository
}

describe('SettingsStore', () => {
    it('starts with what the repository holds', () => {
        const initial = { ...EMPTY_SETTINGS, address: ADDRESS }

        expect(new SettingsStore(repositoryWith(initial)).getSnapshot()).toBe(
            initial
        )
    })

    it('merges a patch, persists it and notifies subscribers', () => {
        const repository = repositoryWith(EMPTY_SETTINGS)
        const store = new SettingsStore(repository)
        const listener = vi.fn()
        store.subscribe(listener)

        const result = store.patch({ address: ADDRESS })

        expect(result).toEqual({
            ok: true,
            value: { ...EMPTY_SETTINGS, address: ADDRESS },
        })
        expect(store.getSnapshot().address).toBe(ADDRESS)
        expect(repository.save).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('can clear an optional field by patching it to undefined (a reset layout)', () => {
        const layout = [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }]
        const store = new SettingsStore(
            repositoryWith({ ...EMPTY_SETTINGS, layout })
        )

        store.patch({ layout: undefined })

        expect(store.getSnapshot().layout).toBeUndefined()
    })

    it('keeps the same snapshot and persists nothing when the patch changes nothing', () => {
        const repository = repositoryWith({
            ...EMPTY_SETTINGS,
            address: ADDRESS,
        })
        const store = new SettingsStore(repository)
        const before = store.getSnapshot()
        const listener = vi.fn()
        store.subscribe(listener)

        const result = store.patch({ address: { ...ADDRESS } })

        expect(result.ok).toBe(true)
        expect(store.getSnapshot()).toBe(before)
        expect(repository.save).not.toHaveBeenCalled()
        expect(listener).not.toHaveBeenCalled()
    })

    it('keeps references of untouched fields, so selectors on them stay quiet', () => {
        const store = new SettingsStore(
            repositoryWith({ ...EMPTY_SETTINGS, address: ADDRESS })
        )
        const address = store.getSnapshot().address

        store.patch({ layout: [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }] })

        expect(store.getSnapshot().address).toBe(address)
    })

    it('still updates the session when persisting fails, and reports it', () => {
        const store = new SettingsStore(
            repositoryWith(EMPTY_SETTINGS, () => false)
        )

        const result = store.patch({ address: ADDRESS })

        expect(result).toEqual({ ok: false, error: 'storage-unavailable' })
        expect(store.getSnapshot().address).toBe(ADDRESS)
    })

    it('replaces the whole value', () => {
        const store = new SettingsStore(
            repositoryWith({ ...EMPTY_SETTINGS, address: ADDRESS })
        )

        store.replace(EMPTY_SETTINGS)

        expect(store.getSnapshot().address).toBeUndefined()
    })

    it('re-reads the repository on reload and notifies only if it differs', () => {
        const repository = repositoryWith({
            ...EMPTY_SETTINGS,
            address: ADDRESS,
        })
        const store = new SettingsStore(repository)
        const listener = vi.fn()
        store.subscribe(listener)

        store.reload()
        expect(listener).not.toHaveBeenCalled()

        repository.stored = EMPTY_SETTINGS // e.g. the storage was cleared
        store.reload()

        expect(store.getSnapshot()).toEqual(EMPTY_SETTINGS)
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
