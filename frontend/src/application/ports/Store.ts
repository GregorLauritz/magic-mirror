/**
 * Observable state, shaped for React's useSyncExternalStore: the members are
 * arrow-bound (safe to pass on as is) and `getSnapshot` returns the same
 * reference until the value really changes.
 */
export interface ObservableStore<T> {
    readonly getSnapshot: () => T
    readonly subscribe: (listener: () => void) => () => void
}
