// Time primitives for the pure domain. Nothing here reads the system clock:
// "now" always arrives through the Clock port, and every zone-dependent
// computation takes an explicit IANA time zone.

/** A point on the UTC timeline, in epoch milliseconds. */
export type Instant = number & { readonly __brand: 'Instant' }

/** An IANA time zone identifier such as "Europe/Berlin". */
export type TimeZoneId = string

export const instant = (epochMs: number): Instant => {
    if (!Number.isFinite(epochMs)) {
        throw new RangeError(`Not a valid instant: ${epochMs}`)
    }
    return epochMs as Instant
}
