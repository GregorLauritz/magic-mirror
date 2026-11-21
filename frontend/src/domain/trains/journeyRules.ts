import type { Journey } from './types'

/** Cancelled when a train leg is; a cancelled walk does not stop anyone. */
export const isCancelled = (journey: Journey): boolean =>
    journey.legs.some((leg) => !leg.walking && leg.cancelled)

/** The lines of the train legs, in travel order. */
export const transitLines = (journey: Journey): string[] =>
    journey.legs.flatMap((leg) =>
        !leg.walking && leg.line !== undefined ? [leg.line] : []
    )

/** The delay in whole minutes, rounded; early or on time is 0. */
export const delayMinutes = (journey: Journey): number =>
    Math.max(0, Math.round(journey.delaySeconds / 60))

export type DelaySeverity = 'none' | 'minor' | 'major'

const MINOR_DELAY_MAX_SECONDS = 300

/** Up to five minutes late is a nuisance, beyond that it is a problem. */
export const delaySeverity = (journey: Journey): DelaySeverity => {
    if (journey.delaySeconds <= 0) return 'none'
    return journey.delaySeconds <= MINOR_DELAY_MAX_SECONDS ? 'minor' : 'major'
}
