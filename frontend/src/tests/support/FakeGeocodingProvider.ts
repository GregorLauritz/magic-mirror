import type {
    GeocodeError,
    GeocodingProvider,
} from '@/application/ports/GeocodingProvider'
import type { Address } from '@/domain/location/Address'
import type { Coordinates } from '@/domain/location/Coordinates'
import { err, ok, type Result } from '@/domain/shared/Result'

export interface GeocodeCall {
    readonly address: Address
    readonly apiKey: string
}

/** Scripted GeocodingProvider that records its calls. */
export class FakeGeocodingProvider implements GeocodingProvider {
    readonly calls: GeocodeCall[] = []

    constructor(
        public result: Result<Coordinates, GeocodeError> = ok({
            latitude: 48.7758,
            longitude: 9.1829,
        })
    ) {}

    failWith(error: GeocodeError): this {
        this.result = err(error)
        return this
    }

    async geocode(
        address: Address,
        apiKey: string
    ): Promise<Result<Coordinates, GeocodeError>> {
        this.calls.push({ address, apiKey })
        return this.result
    }
}
