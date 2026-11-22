import { useMemo } from 'react'
import { useServices } from '@/app/services/useServices'
import {
    subscribeMinute,
    type Subscribe,
} from '@/application/time/subscribeMinute'

/** A stable subscribe function (identity changes only with the services). */
export const useMinuteSubscription = (): Subscribe => {
    const { clock, scheduler } = useServices()
    return useMemo(() => subscribeMinute(clock, scheduler), [clock, scheduler])
}
