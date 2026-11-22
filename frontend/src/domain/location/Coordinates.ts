import { err, ok, type Result } from '@/domain/shared/Result'

export interface Coordinates {
    readonly latitude: number
    readonly longitude: number
}

/**
 * Validates a coordinate pair. (0, 0) is valid: it is a real place, so it must
 * never be used to mean "unknown". NaN (e.g. from parseFloat of junk) and
 * out-of-range values are rejected.
 */
export const makeCoordinates = (
    latitude: number,
    longitude: number
): Result<Coordinates, 'invalid'> =>
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
        ? ok({ latitude, longitude })
        : err('invalid')
