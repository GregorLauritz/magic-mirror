import { describe, expect, it } from 'vitest'
import {
    isGeocodable,
    sameAddress,
    type Address,
} from '@/domain/location/Address'

const address = (overrides: Partial<Address> = {}): Address => ({
    country: 'DE',
    city: 'Stuttgart',
    postalCode: '70176',
    ...overrides,
})

describe('isGeocodable', () => {
    it('is true for a complete address', () => {
        expect(isGeocodable(address())).toBe(true)
    })

    it('is true with a city and no postal code (B11a: it never geocoded before)', () => {
        expect(isGeocodable(address({ postalCode: '' }))).toBe(true)
    })

    it('is true with a postal code and no city', () => {
        expect(isGeocodable(address({ city: '' }))).toBe(true)
    })

    it('is false with a country only: the form accepted it but nothing could be looked up', () => {
        expect(isGeocodable(address({ city: '', postalCode: '' }))).toBe(false)
    })

    it('is false without a country, whatever else is set', () => {
        expect(isGeocodable(address({ country: '' }))).toBe(false)
    })

    it('treats whitespace-only fields as empty', () => {
        expect(isGeocodable(address({ city: '  ', postalCode: '\t' }))).toBe(
            false
        )
        expect(isGeocodable(address({ country: ' ' }))).toBe(false)
    })

    it('is false when there is no address at all', () => {
        expect(isGeocodable(undefined)).toBe(false)
    })
})

describe('sameAddress', () => {
    it.each([
        ['identical fields', address(), address(), true],
        ['both absent', undefined, undefined, true],
        ['one absent', address(), undefined, false],
        ['other city', address(), address({ city: 'Berlin' }), false],
        ['other postal code', address(), address({ postalCode: '1' }), false],
        ['other country', address(), address({ country: 'AT' }), false],
    ])('%s', (_, a, b, expected) => {
        expect(sameAddress(a, b)).toBe(expected)
        expect(sameAddress(b, a)).toBe(expected)
    })
})
