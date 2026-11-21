import type { Coordinates } from '@/domain/location/Coordinates'

export type CoordinatesState =
    | { readonly status: 'loading' }
    | { readonly status: 'not-configured' }
    | { readonly status: 'ready'; readonly coordinates: Coordinates }
