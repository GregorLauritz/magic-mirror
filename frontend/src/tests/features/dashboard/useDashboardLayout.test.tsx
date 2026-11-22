import { describe, expect, it } from 'vitest'
import { act } from '@testing-library/react'
import { useDashboardLayout } from '@/features/dashboard/useDashboardLayout'
import { DEFAULT_LAYOUT } from '@/features/dashboard/widgetRegistry'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const CUSTOM = [
    { widgetId: 'trains', x: 0, y: 0, w: 6, h: 2 },
    { widgetId: 'time', x: 6, y: 0, w: 2, h: 1 },
]

class CountingStore extends InMemoryKeyValueStore {
    writes = 0
    override set(key: string, value: string): boolean {
        this.writes++
        return super.set(key, value)
    }
}

const setup = (saved?: unknown[]) => {
    const store = new CountingStore()
    if (saved)
        store.set(
            STORAGE_KEYS.userSettings,
            JSON.stringify({ widget_layout: saved })
        )
    store.writes = 0
    const test = createTestContainer({ localStore: store })
    const rendered = renderHookWithDeps(() => useDashboardLayout(), {
        deps: test.deps,
    })
    const stored = () =>
        JSON.parse(store.get(STORAGE_KEYS.userSettings) ?? '{}').widget_layout
    return { ...rendered, store, stored }
}

const asSaved = (placements: typeof CUSTOM) =>
    placements.map((p) => ({ i: p.widgetId, x: p.x, y: p.y, w: p.w, h: p.h }))

describe('useDashboardLayout', () => {
    it('is the default layout when nothing was saved', () => {
        const { result } = setup()

        expect(result.current.layout).toEqual(DEFAULT_LAYOUT)
    })

    it('is the saved layout, with the widgets it lacks placed below', () => {
        const { result } = setup(asSaved(CUSTOM))

        expect(result.current.layout.slice(0, 2)).toEqual(CUSTOM)
        expect(result.current.layout.map((p) => p.widgetId).sort()).toEqual(
            DEFAULT_LAYOUT.map((p) => p.widgetId).sort()
        )
    })

    it('saves a changed layout at once, with no waiting', () => {
        const { result, stored } = setup()

        act(() => void result.current.save(CUSTOM))

        expect(stored()).toEqual(asSaved(CUSTOM))
    })

    it('does not write when the layout did not change (a drag that ends where it began)', () => {
        const { result, store } = setup(asSaved(CUSTOM))
        const current = result.current.layout

        act(() => void result.current.save([...current].reverse()))

        expect(store.writes).toBe(0)
    })

    it('forgets the saved layout when reset, which means the default', () => {
        const { result, stored } = setup(asSaved(CUSTOM))

        let ok = false
        act(() => {
            ok = result.current.reset()
        })

        expect(ok).toBe(true)
        expect(stored()).toBeUndefined()
        expect(result.current.layout).toEqual(DEFAULT_LAYOUT)
    })

    it('says when the layout could not be saved', () => {
        const { result, store } = setup()
        store.failWrites = true

        let ok = true
        act(() => {
            ok = result.current.save(CUSTOM)
        })

        expect(ok).toBe(false)
    })
})
