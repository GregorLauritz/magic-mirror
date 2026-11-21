import { useSyncExternalStore } from 'react'
import { useServices } from '@/app/services/useServices'
import { floorToMinute, type Instant } from '@/domain/shared/time'
import { useMinuteSubscription } from './useMinuteSubscription'

/** The current time, floored to the minute; re-renders once per minute. */
export const useNow = (): Instant => {
    const { clock } = useServices()
    const subscribe = useMinuteSubscription()
    // A primitive snapshot is referentially stable between ticks.
    return useSyncExternalStore(subscribe, () => floorToMinute(clock.now()))
}
