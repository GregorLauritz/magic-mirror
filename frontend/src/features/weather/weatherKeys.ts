import type { Coordinates } from '@/domain/location/Coordinates'
import type { TimeZoneId } from '@/domain/shared/time'

// Query keys of the weather feature. The zone is part of every key because the
// provider's answer (day boundaries, daily dates) depends on it.
export const weatherKeys = {
    current: (c: Coordinates, timeZone: TimeZoneId) =>
        ['weather', 'current', c.latitude, c.longitude, timeZone] as const,
    hourly: (c: Coordinates, timeZone: TimeZoneId) =>
        ['weather', 'hourly', c.latitude, c.longitude, timeZone] as const,
    daily: (c: Coordinates, timeZone: TimeZoneId, days: number) =>
        ['weather', 'daily', c.latitude, c.longitude, timeZone, days] as const,
}
