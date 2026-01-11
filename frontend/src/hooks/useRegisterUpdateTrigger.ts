import { useEffect, useRef, useCallback } from 'react'
import { UpdateTrigger } from '../common/TimeContext'

/**
 * Registers an update trigger function once on mount.
 * The hook creates a stable wrapper around refetchFn to prevent stale closures.
 * This ensures that when the trigger is called, it always uses the latest refetchFn.
 */
export const useRegisterUpdateTrigger = (
    registerFn: (trigger: UpdateTrigger) => void,
    refetchFn: () => void
): void => {
    const isRegistered = useRef<boolean>(false)
    const refetchRef = useRef(refetchFn)

    // Keep the refetch function reference up to date
    // This pattern prevents stale closures while maintaining a stable trigger reference
    useEffect(() => {
        refetchRef.current = refetchFn
    }, [refetchFn])

    // Create a stable trigger function that calls the latest refetch
    // This wrapper is memoized and will not change across re-renders
    const stableTrigger = useCallback(() => {
        refetchRef.current()
    }, [])

    // Register only once on mount
    useEffect(() => {
        if (!isRegistered.current) {
            registerFn(stableTrigger)
            isRegistered.current = true
        }
    }, [registerFn, stableTrigger])
}
