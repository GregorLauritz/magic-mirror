import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES, findCountryCode } from '@/domain/location/countries'

describe('COUNTRY_CODES', () => {
    it('are two-letter upper-case codes, each once', () => {
        expect(COUNTRY_CODES.every((code) => /^[A-Z]{2}$/.test(code))).toBe(
            true
        )
        expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
    })

    it('cover the world (every code the old picker offered)', () => {
        expect(COUNTRY_CODES.length).toBeGreaterThanOrEqual(240)
        for (const code of ['DE', 'US', 'GB', 'JP', 'AU', 'XK', 'CH']) {
            expect(COUNTRY_CODES).toContain(code)
        }
    })

    it('are sorted, so a list built from them is stable', () => {
        expect([...COUNTRY_CODES].sort()).toEqual([...COUNTRY_CODES])
    })
})

describe('findCountryCode', () => {
    it.each([
        ['DE', 'DE'],
        ['de', 'DE'],
        [' De ', 'DE'],
    ])('reads %j as %s', (raw, code) => {
        expect(findCountryCode(raw)).toBe(code)
    })

    it.each(['', 'DEU', 'ZZ', 'Germany', '1'])('does not know %j', (raw) => {
        expect(findCountryCode(raw)).toBeUndefined()
    })
})
