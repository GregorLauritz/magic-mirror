import type { GeocodeError } from '@/application/ports/GeocodingProvider'
import type { Coordinates } from '@/domain/location/Coordinates'

export type CoordinatesState =
    | { readonly status: 'loading' }
    | {
          readonly status: 'not-configured'
          readonly reason: 'no-address' | 'no-api-key'
      }
    | { readonly status: 'ready'; readonly coordinates: Coordinates }
    | { readonly status: 'error'; readonly reason: GeocodeError }
