import type {
    GeocodeError,
    GeocodingProvider,
} from '@/application/ports/GeocodingProvider'
import type { HttpClient } from '@/application/ports/HttpClient'
import {
    HttpError,
    NetworkError,
    ProviderResponseError,
    TimeoutError,
} from '@/application/ports/errors'
import type { Address } from '@/domain/location/Address'
import {
    makeCoordinates,
    type Coordinates,
} from '@/domain/location/Coordinates'
import { err, type Result } from '@/domain/shared/Result'

type Outcome = Result<Coordinates, GeocodeError>

interface Hit {
    readonly lat: unknown
    readonly lon: unknown
    readonly importance?: unknown
}

const isHit = (value: unknown): value is Hit =>
    typeof value === 'object' && value !== null

const importanceOf = (hit: Hit): number => Number(hit.importance) || 0

const pickBest = (hits: readonly Hit[]): Hit =>
    hits.reduce((best, hit) =>
        importanceOf(hit) > importanceOf(best) ? hit : best
    )

const parse = (body: unknown): Outcome => {
    if (!Array.isArray(body) || !body.every(isHit))
        return err('invalid-response')
    if (body.length === 0) return err('not-found')
    const best = pickBest(body)
    const coordinates = makeCoordinates(
        Number.parseFloat(String(best.lat)),
        Number.parseFloat(String(best.lon))
    )
    return coordinates.ok ? coordinates : err('invalid-response')
}

const failure = (error: unknown): Outcome => {
    if (error instanceof HttpError) {
        if (error.status === 401 || error.status === 403)
            return err('unauthorized')
        if (error.status === 429 || error.status >= 500) return err('network')
        return err('invalid-response')
    }
    if (error instanceof NetworkError || error instanceof TimeoutError)
        return err('network')
    if (error instanceof ProviderResponseError) return err('invalid-response')
    // Anything else (notably an abort by the caller) is not a lookup result.
    throw error
}

/** geocode.maps.co: free-text address to coordinates; needs the user's own key. */
export class MapsCoGeocodingProvider implements GeocodingProvider {
    constructor(
        private readonly http: HttpClient,
        private readonly baseUrl: string
    ) {}

    async geocode(
        address: Address,
        apiKey: string,
        signal?: AbortSignal
    ): Promise<Outcome> {
        const params = new URLSearchParams({
            country: address.country,
            api_key: apiKey,
        })
        if (address.postalCode.trim() !== '')
            params.append('postalcode', address.postalCode)
        if (address.city.trim() !== '') params.append('city', address.city)

        try {
            const body = await this.http.getJson<unknown>({
                url: `${this.baseUrl}/search?${params.toString()}`,
                signal,
            })
            return parse(body)
        } catch (error) {
            return failure(error)
        }
    }
}
