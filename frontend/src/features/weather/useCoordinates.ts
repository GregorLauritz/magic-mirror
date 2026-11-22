import { useQuery } from 'react-query'
import { useServices } from '@/app/services/useServices'
import { NetworkError } from '@/application/ports/errors'
import type { GeocodeError } from '@/application/ports/GeocodingProvider'
import { isGeocodable } from '@/domain/location/Address'
import type { Coordinates } from '@/domain/location/Coordinates'
import { useApiKeys, useSetting } from '@/features/settings'
import type { CoordinatesState } from './CoordinatesState'

/** A lookup that failed for a reason a second attempt cannot fix. */
class LocationLookupError extends Error {
    constructor(readonly reason: Exclude<GeocodeError, 'network'>) {
        super(`Location lookup failed: ${reason}`)
        this.name = 'LocationLookupError'
    }
}

/**
 * Where the weather is for: the configured address, resolved once to
 * coordinates. Every state is explicit, so nothing downstream has to guess what
 * a (0, 0) might mean.
 */
export const useCoordinates = (): CoordinatesState => {
    const { resolveCoordinates, config } = useServices()
    const address = useSetting((settings) => settings.address)
    const { apiKeys } = useApiKeys()
    const apiKey = apiKeys.geocodeApiKey.trim()

    const geocodable = isGeocodable(address)
    const hasKey = apiKey !== ''

    const query = useQuery<Coordinates, Error>(
        [
            'location',
            address?.country,
            address?.city,
            address?.postalCode,
            apiKey,
        ],
        async ({ signal }) => {
            const result = await resolveCoordinates(address, apiKey, signal)
            if (result.ok) return result.value
            // Connectivity problems are retryable under the global query policy;
            // the other failures cannot succeed on a second try.
            if (result.error === 'network') {
                throw new NetworkError(
                    'Location lookup could not reach the provider'
                )
            }
            throw new LocationLookupError(
                result.error as LocationLookupError['reason']
            )
        },
        {
            enabled: geocodable && hasKey,
            // An address does not move: resolve it once per address and key.
            staleTime: Infinity,
            cacheTime: Infinity,
            // A kiosk gets no focus events, so after a connectivity failure keep
            // trying on the normal refresh interval. Failures that retrying
            // cannot fix (unknown place, rejected key) stop until the settings
            // change, so the rate-limited provider is not hammered.
            refetchInterval: (_data, failedQuery) =>
                failedQuery.state.error instanceof NetworkError
                    ? config.refreshIntervalMs
                    : false,
        }
    )

    if (!geocodable) return { status: 'not-configured', reason: 'no-address' }
    if (!hasKey) return { status: 'not-configured', reason: 'no-api-key' }
    if (query.data) return { status: 'ready', coordinates: query.data }
    if (query.isError) {
        const reason =
            query.error instanceof LocationLookupError
                ? query.error.reason
                : 'network'
        return { status: 'error', reason }
    }
    return { status: 'loading' }
}
