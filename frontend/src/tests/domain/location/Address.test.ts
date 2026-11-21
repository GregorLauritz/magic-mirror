import { describe, expect, it } from 'vitest'
import { isGeocodable, type Address } from '@/domain/location/Address'

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
