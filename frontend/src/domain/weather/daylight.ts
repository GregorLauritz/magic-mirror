import type { Instant } from '@/domain/shared/time'

export interface SunWindow {
    readonly sunrise: Instant
    readonly sunset: Instant
}

/**
 * Whether the sun is up at an instant, given the sun windows of the days around
 * it. Each instant is judged against the window of its own day, so a forecast
 * that spans midnight needs one window per day. Sunrise counts as day, sunset
 * as night.
 */
export const isDaylight = (
    at: Instant,
    windows: readonly SunWindow[]
): boolean =>
    windows.some((window) => at >= window.sunrise && at < window.sunset)
