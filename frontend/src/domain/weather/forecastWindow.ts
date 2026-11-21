import type { Instant, PlainDate } from '@/domain/shared/time'

const HOUR_MS = 3_600_000

/**
 * The entries after `now`, up to and including `now + count` hours. That
 * half-open window is exactly `count` hours long, so an hourly series yields
 * exactly `count` entries wherever `now` falls. Pure of the clock, so the
 * visible window can advance without refetching.
 */
export const upcomingHours = <T extends { readonly at: Instant }>(
    entries: readonly T[],
    now: Instant,
    count: number
): T[] =>
    entries.filter(
        (entry) => entry.at > now && entry.at - now <= count * HOUR_MS
    )

/** The first `count` days strictly after `today`, in input order. */
export const dailyAfterToday = <T extends { readonly date: PlainDate }>(
    entries: readonly T[],
    today: PlainDate,
    count: number
): T[] => entries.filter((entry) => entry.date > today).slice(0, count)
