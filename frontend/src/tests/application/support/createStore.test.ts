import { describe, expect, it, vi } from 'vitest'
import { createStore } from '@/application/support/createStore'

describe('createStore', () => {
    it('serves the initial value, referentially stable until it really changes', () => {
        const initial = { n: 1 }
        const store = createStore(initial)

        expect(store.getSnapshot()).toBe(initial)
        expect(store.getSnapshot()).toBe(store.getSnapshot())
    })

    it('replaces the snapshot and notifies subscribers on change', () => {
        const store = createStore(1)
        const listener = vi.fn()
        store.subscribe(listener)

        store.set(2)

        expect(store.getSnapshot()).toBe(2)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('stays silent when the value is unchanged', () => {
        const store = createStore(1)
        const listener = vi.fn()
        store.subscribe(listener)

        store.set(1)

        expect(listener).not.toHaveBeenCalled()
    })

    it('keeps the old reference when a custom equality says nothing changed', () => {
        const first = { id: 1 }
        const store = createStore(first, (a, b) => a.id === b.id)
        const listener = vi.fn()
        store.subscribe(listener)

        store.set({ id: 1 })

        expect(store.getSnapshot()).toBe(first)
        expect(listener).not.toHaveBeenCalled()
    })

    it('stops notifying after unsubscribe, and unsubscribing twice is harmless', () => {
        const store = createStore(1)
        const listener = vi.fn()
        const unsubscribe = store.subscribe(listener)

        unsubscribe()
        unsubscribe()
        store.set(2)

        expect(listener).not.toHaveBeenCalled()
    })

    it('keeps subscribers independent of each other', () => {
        const store = createStore(1)
        const first = vi.fn()
        const second = vi.fn()
        const stopFirst = store.subscribe(first)
        store.subscribe(second)

        stopFirst()
        store.set(2)

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('tolerates a listener that unsubscribes while being notified', () => {
        const store = createStore(1)
        const other = vi.fn()
        const stop = store.subscribe(() => stop())
        store.subscribe(other)

        store.set(2)

        expect(other).toHaveBeenCalledTimes(1)
    })

    it('exposes bound members so they can be passed on without .bind', () => {
        const { getSnapshot, subscribe } = createStore(7)

        expect(getSnapshot()).toBe(7)
        expect(typeof subscribe(() => {})).toBe('function')
    })
})
