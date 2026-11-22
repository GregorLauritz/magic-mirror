import type { ObservableStore } from '@/application/ports/Store'

export interface Store<T> extends ObservableStore<T> {
    set(next: T): void
}

/**
 * A small observable value. A new value that `isEqual` to the current one is
 * ignored, so the snapshot keeps its reference and subscribers stay quiet.
 */
export const createStore = <T>(
    initial: T,
    isEqual: (a: T, b: T) => boolean = Object.is
): Store<T> => {
    let current = initial
    const listeners = new Set<() => void>()

    return {
        getSnapshot: () => current,
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        set: (next) => {
            if (isEqual(current, next)) return
            current = next
            // Iterate a copy: a listener may unsubscribe while being notified.
            for (const listener of [...listeners]) listener()
        },
    }
}
