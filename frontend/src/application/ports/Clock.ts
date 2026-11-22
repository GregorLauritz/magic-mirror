import type { Instant, TimeZoneId } from '@/domain/shared/time'

/** The only source of "now" and "where am I" for business logic. */
export interface Clock {
    now(): Instant
    timeZone(): TimeZoneId
}
