export interface Address {
    /** What the country picker yields (ISO 3166-1 alpha-2 code). */
    readonly country: string
    readonly city: string
    readonly postalCode: string
}

const filled = (value: string): boolean => value.trim() !== ''

/**
 * Whether there is enough of an address to look up: a country plus a city or a
 * postal code. A country alone matches too much to be a location.
 */
export const isGeocodable = (
    address: Address | undefined
): address is Address =>
    address !== undefined &&
    filled(address.country) &&
    (filled(address.city) || filled(address.postalCode))

/** Pre-fills the settings form for a first-time user. Never an effective setting. */
export const DEFAULT_ADDRESS: Address = {
    country: 'DE',
    city: 'Stuttgart',
    postalCode: '70176',
}

/** Whether two addresses name the same place, field by field (both absent counts as equal). */
export const sameAddress = (
    a: Address | undefined,
    b: Address | undefined
): boolean =>
    a === b ||
    (a !== undefined &&
        b !== undefined &&
        a.country === b.country &&
        a.city === b.city &&
        a.postalCode === b.postalCode)
