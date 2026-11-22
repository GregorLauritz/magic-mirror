import { transitLines } from '@/domain/trains/journeyRules'
import type { Journey } from '@/domain/trains/types'

/** 125 -> "2h 5m", 20 -> "20m". */
export const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

/** "RE 5 → ICE 71 • 2h 30m"; without a known line, just the duration. */
export const journeySummary = (journey: Journey): string =>
    [transitLines(journey).join(' → '), formatDuration(journey.durationMinutes)]
        .filter((part) => part !== '')
        .join(' • ')
