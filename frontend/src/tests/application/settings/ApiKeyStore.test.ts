import { describe, expect, it, vi } from 'vitest'
import { ApiKeyStore } from '@/application/settings/ApiKeyStore'
import type { ApiKeyRepository } from '@/application/ports/ApiKeyRepository'
import type { ApiKeys } from '@/domain/settings/ApiKeys'

const repositoryWith = (
    initial: ApiKeys,
    overrides: Partial<ApiKeyRepository> = {}
): ApiKeyRepository & { stored: ApiKeys } => {
    const repository: ApiKeyRepository & { stored: ApiKeys } = {
        stored: initial,
        load: vi.fn(() => repository.stored),
        save: vi.fn((keys: ApiKeys) => {
            repository.stored = keys
            return true
        }),
        clear: vi.fn(),
        ...overrides,
    }
    return repository
}

describe('ApiKeyStore', () => {
    it('starts with what the repository holds', () => {
        const store = new ApiKeyStore(repositoryWith({ geocodeApiKey: 'abc' }))

        expect(store.getSnapshot()).toEqual({ geocodeApiKey: 'abc' })
    })

    it('merges a partial update, persists it and notifies subscribers', () => {
        const repository = repositoryWith({ geocodeApiKey: 'old' })
        const store = new ApiKeyStore(repository)
        const listener = vi.fn()
        store.subscribe(listener)

        const persisted = store.set({ geocodeApiKey: 'new' })

        expect(persisted).toBe(true)
        expect(store.getSnapshot()).toEqual({ geocodeApiKey: 'new' })
        expect(repository.save).toHaveBeenCalledWith({ geocodeApiKey: 'new' })
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('keeps the same snapshot and stays silent when nothing changed', () => {
        const store = new ApiKeyStore(repositoryWith({ geocodeApiKey: 'same' }))
        const before = store.getSnapshot()
        const listener = vi.fn()
        store.subscribe(listener)

        store.set({ geocodeApiKey: 'same' })

        expect(store.getSnapshot()).toBe(before)
        expect(listener).not.toHaveBeenCalled()
    })

    it('still updates the session when persisting fails, and says so', () => {
        const repository = repositoryWith(
            { geocodeApiKey: '' },
            { save: vi.fn(() => false) }
        )
        const store = new ApiKeyStore(repository)

        const persisted = store.set({ geocodeApiKey: 'typed' })

        expect(persisted).toBe(false)
        expect(store.getSnapshot()).toEqual({ geocodeApiKey: 'typed' })
    })

    it('re-reads the repository on reload and notifies only if it differs', () => {
        const repository = repositoryWith({ geocodeApiKey: 'a' })
        const store = new ApiKeyStore(repository)
        const listener = vi.fn()
        store.subscribe(listener)

        store.reload()
        expect(listener).not.toHaveBeenCalled()

        repository.stored = { geocodeApiKey: '' } // e.g. storage was cleared
        store.reload()

        expect(store.getSnapshot()).toEqual({ geocodeApiKey: '' })
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
