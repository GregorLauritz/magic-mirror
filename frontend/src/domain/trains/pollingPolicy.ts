import type { Instant } from '@/domain/shared/time'
import type { Journey } from './types'

/** How often to look while nothing is about to leave. */
export const POLL_FAR_MS = 300_000
/** How often to look once a train is about to leave. */
export const POLL_NEAR_MS = 60_000
/** "About to leave": the last five minutes before the departure. */
export const NEAR_WINDOW_MS = 300_000

/**
 * How long to wait before asking again. The next poll is aimed at the moment
 * the near window opens, so a change right before departure is seen in time,
 * and it never comes faster than the near interval. `departure` is the actual
 * (real-time) moment, so a delayed train needs no correction here.
 */
export const nextPollDelayMs = (
    journeys: readonly Journey[],
    now: Instant
): number => {
    if (journeys.length === 0) return POLL_FAR_MS

    const upcoming = journeys.filter((journey) => journey.departure >= now)
    // Everything listed has left: get a fresh list soon.
    if (upcoming.length === 0) return POLL_NEAR_MS

    const next = Math.min(...upcoming.map((journey) => journey.departure))
    const untilNearWindow = next - now - NEAR_WINDOW_MS
    return Math.min(POLL_FAR_MS, Math.max(POLL_NEAR_MS, untilNearWindow))
}
