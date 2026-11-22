import type { Address } from '@/domain/location/Address'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { Result } from '@/domain/shared/Result'

export type GeocodeError =
    /** The provider knows no such place. */
    | 'not-found'
    /** The provider answered, but with something unusable. */
    | 'invalid-response'
    /** The API key was refused. */
    | 'unauthorized'
    /** Unreachable, rate-limited or failing: worth trying again later. */
    | 'network'

export interface GeocodingProvider {
    /** Rejects only when the caller aborts; every other failure is a value. */
    geocode(
        address: Address,
        apiKey: string,
        signal?: AbortSignal
    ): Promise<Result<Coordinates, GeocodeError>>
}
