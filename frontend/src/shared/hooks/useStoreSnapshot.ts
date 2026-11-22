import { useSyncExternalStore } from 'react'
import type { ObservableStore } from '@/application/ports/Store'

/** Subscribes a component to an application store. */
export const useStoreSnapshot = <T>(store: ObservableStore<T>): T =>
    useSyncExternalStore(store.subscribe, store.getSnapshot)
