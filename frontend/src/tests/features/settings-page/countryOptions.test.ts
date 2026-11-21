import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from '@/domain/location/countries'
import {
    buildCountryOptions,
    flagEmoji,
} from '@/features/settings-page/countryOptions'

describe('flagEmoji', () => {
    it.each([
        ['DE', '🇩🇪'],
        ['us', '🇺🇸'],
        ['JP', '🇯🇵'],
    ])('%s is %s', (code, flag) => {
        expect(flagEmoji(code)).toBe(flag)
    })
})

describe('buildCountryOptions', () => {
    const nameOf = (locale: string, code: string) =>
        buildCountryOptions(locale).find((option) => option.code === code)?.name

    it('offers every country once, with its flag', () => {
        const options = buildCountryOptions('en-US')

        expect(options.map((option) => option.code).sort()).toEqual([
            ...COUNTRY_CODES,
        ])
        expect(options.find((option) => option.code === 'DE')?.flag).toBe('🇩🇪')
    })

    it('names the countries in the display language (no hand-typed, misspelled labels)', () => {
        expect(nameOf('en-US', 'DE')).toBe('Germany')
        expect(nameOf('de-DE', 'DE')).toBe('Deutschland')
        expect(nameOf('en-US', 'CZ')).toBe('Czechia')
        expect(nameOf('en-US', 'XK')).toBe('Kosovo')
    })

    it('sorts by the displayed name', () => {
        const names = buildCountryOptions('de-DE').map((option) => option.name)

        for (let i = 1; i < names.length; i++) {
            expect(
                names[i - 1].localeCompare(names[i], 'de-DE')
            ).toBeLessThanOrEqual(0)
        }
    })

    it('falls back to the code when the locale is not usable', () => {
        const options = buildCountryOptions('not a locale!')

        expect(options).toHaveLength(COUNTRY_CODES.length)
        expect(options.find((option) => option.code === 'DE')?.name).toBe('DE')
    })
})
