import { describe, expect, it } from 'vitest'
import { makeCoordinates } from '@/domain/location/Coordinates'

describe('makeCoordinates', () => {
    it('accepts ordinary coordinates', () => {
        expect(makeCoordinates(48.7758, 9.1829)).toEqual({
            ok: true,
            value: { latitude: 48.7758, longitude: 9.1829 },
        })
    })

    it('accepts (0, 0): a real place in the Gulf of Guinea, not "unknown" (B10)', () => {
        expect(makeCoordinates(0, 0)).toEqual({
            ok: true,
            value: { latitude: 0, longitude: 0 },
        })
    })

    it.each([
        [90, 180],
        [-90, -180],
    ])('accepts the boundary (%i, %i)', (latitude, longitude) => {
        expect(makeCoordinates(latitude, longitude).ok).toBe(true)
    })

    it.each([
        [Number.NaN, 9],
        [48, Number.NaN],
        [Number.POSITIVE_INFINITY, 9],
        [48, Number.NEGATIVE_INFINITY],
        [90.0001, 9],
        [-90.0001, 9],
        [48, 180.0001],
        [48, -180.0001],
    ])(
        'rejects (%s, %s) as invalid (B11: parseFloat of junk gave NaN)',
        (latitude, longitude) => {
            expect(makeCoordinates(latitude, longitude)).toEqual({
                ok: false,
                error: 'invalid',
            })
        }
    )
})
