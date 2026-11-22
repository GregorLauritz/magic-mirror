import type {
    GeocodeError,
    GeocodingProvider,
} from '@/application/ports/GeocodingProvider'
import { isGeocodable, type Address } from '@/domain/location/Address'
import type { Coordinates } from '@/domain/location/Coordinates'
import { err, type Result } from '@/domain/shared/Result'

export type LocationError = 'not-configured' | 'no-api-key' | GeocodeError

export type ResolveCoordinates = (
    address: Address | undefined,
    apiKey: string,
    signal?: AbortSignal
) => Promise<Result<Coordinates, LocationError>>

/**
 * Turns the configured address into coordinates. It refuses to call the
 * provider (and spend a rate-limited request) when there is nothing sensible
 * to ask for.
 */
export const createResolveCoordinates =
    ({ geocoding }: { geocoding: GeocodingProvider }): ResolveCoordinates =>
    async (address, apiKey, signal) => {
        if (!isGeocodable(address)) return err('not-configured')
        if (apiKey.trim() === '') return err('no-api-key')
        return geocoding.geocode(address, apiKey, signal)
    }
