import { toPlainDate, zonedParts } from '@/domain/shared/time'
import { useNow } from './useNow'
import { useTimeZone } from './useTimeZone'

/** A string that changes when the local hour does, e.g. "2024-01-15T21". */
export const useHourKey = (): string => {
    const now = useNow()
    const timeZone = useTimeZone()
    const hour = String(zonedParts(now, timeZone).hour).padStart(2, '0')
    return `${toPlainDate(now, timeZone)}T${hour}`
}
