import type { Instant } from '@/domain/shared/time'

export interface Station {
    readonly id: string
    readonly name: string
}

/** One stretch of a journey: a train, or a walk between stops. */
export interface JourneyLeg {
    readonly line?: string
    readonly walking: boolean
    readonly cancelled: boolean
}

/** A way to get from one station to another. */
export interface Journey {
    /**
     * When the first leg actually leaves. The delay is already included: this
     * is the real-time moment, not the timetable.
     */
    readonly departure: Instant
    readonly arrival: Instant
    /** How late the departure is, in SECONDS; 0 when on time or unknown. */
    readonly delaySeconds: number
    readonly durationMinutes: number
    readonly departurePlatform?: string
    readonly legs: readonly JourneyLeg[]
}
