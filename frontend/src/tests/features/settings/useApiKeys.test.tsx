import { describe, expect, it } from 'vitest'
import { act } from '@testing-library/react'
import { useApiKeys } from '@/features/settings'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const storeWith = (raw?: string) => {
    const store = new InMemoryKeyValueStore()
    if (raw !== undefined) store.set(STORAGE_KEYS.apiKeys, raw)
    return store
}

describe('useApiKeys', () => {
    it('has the saved key on the very first render, without waiting a tick', () => {
        const test = createTestContainer({
            localStore: storeWith('{"geocodeApiKey":"saved"}'),
        })

        const { result } = renderHookWithDeps(() => useApiKeys(), {
            deps: test.deps,
        })

        expect(result.current.apiKeys.geocodeApiKey).toBe('saved')
        expect(result.current.isLoading).toBe(false)
    })

    it('updates every subscriber and persists when a key is set', () => {
        const store = storeWith()
        const test = createTestContainer({ localStore: store })
        const first = renderHookWithDeps(() => useApiKeys(), {
            deps: test.deps,
        })
        const second = renderHookWithDeps(() => useApiKeys(), {
            deps: test.deps,
        })

        act(() => {
            first.result.current.setApiKeys({ geocodeApiKey: 'typed' })
        })

        expect(first.result.current.apiKeys.geocodeApiKey).toBe('typed')
        expect(second.result.current.apiKeys.geocodeApiKey).toBe('typed')
        expect(JSON.parse(store.get(STORAGE_KEYS.apiKeys)!)).toEqual({
            geocodeApiKey: 'typed',
        })
    })

    it('returns a stable setter so callers can use it in effect dependencies', () => {
        const test = createTestContainer()
        const { result, rerender } = renderHookWithDeps(() => useApiKeys(), {
            deps: test.deps,
        })
        const first = result.current.setApiKeys

        rerender()

        expect(result.current.setApiKeys).toBe(first)
    })
})
