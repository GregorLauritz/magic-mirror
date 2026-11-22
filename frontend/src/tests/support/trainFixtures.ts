import type { Journey, JourneyLeg } from '@/domain/trains/types'
import { instant } from '@/domain/shared/time'

const MINUTE_MS = 60_000

export const leg = (overrides: Partial<JourneyLeg> = {}): JourneyLeg => ({
    line: 'ICE 1',
    walking: false,
    cancelled: false,
    ...overrides,
})

/** A journey that departs at `departureIso` (actual time, delay included). */
export const journey = (
    departureIso: string,
    overrides: Partial<Journey> = {}
): Journey => {
    const departure = Date.parse(departureIso)
    const durationMinutes = overrides.durationMinutes ?? 60
    return {
        departure: instant(departure),
        arrival: instant(departure + durationMinutes * MINUTE_MS),
        delaySeconds: 0,
        durationMinutes,
        legs: [leg()],
        ...overrides,
    }
}
