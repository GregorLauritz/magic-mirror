import { useSyncExternalStore } from 'react'
import { useServices } from '@/app/services/useServices'
import type { TimeZoneId } from '@/domain/shared/time'
import { useMinuteSubscription } from './useMinuteSubscription'

/** The display time zone; re-checked once per minute. */
export const useTimeZone = (): TimeZoneId => {
    const { clock } = useServices()
    const subscribe = useMinuteSubscription()
    return useSyncExternalStore(subscribe, () => clock.timeZone())
}
