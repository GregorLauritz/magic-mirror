import { useEffect, useState } from 'react'
import { useServices } from '@/app/services/useServices'

/**
 * The value, but only once it has stopped changing for `delayMs`. Timing goes
 * through the Scheduler port, so tests drive it without waiting.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
    const { scheduler } = useServices()
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        if (Object.is(value, debounced)) return
        // Cancelled by the next change, or on unmount.
        return scheduler.setTimeout(() => setDebounced(value), delayMs)
    }, [value, debounced, delayMs, scheduler])

    return debounced
}
