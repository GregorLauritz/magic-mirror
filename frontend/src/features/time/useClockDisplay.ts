import { useServices } from '@/app/services/useServices'
import { formatClock, type ClockDisplay } from './format'
import { useNow } from './useNow'
import { useTimeZone } from './useTimeZone'

export const useClockDisplay = (): ClockDisplay => {
    const { config } = useServices()
    return formatClock(useNow(), useTimeZone(), config.locale)
}
