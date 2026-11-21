import { COUNTRY_CODES } from '@/domain/location/countries'

export interface CountryOption {
    readonly code: string
    /** In the display language. */
    readonly name: string
    /** The flag as emoji: no image has to be fetched from another site. */
    readonly flag: string
}

const REGIONAL_INDICATOR_A = 0x1f1e6
const LETTER_A = 'A'.charCodeAt(0)

/** "DE" -> the German flag, built from two regional indicator letters. */
export const flagEmoji = (code: string): string =>
    String.fromCodePoint(
        ...[...code.toUpperCase()].map(
            (letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LETTER_A
        )
    )

const regionNames = (locale: string): Intl.DisplayNames | undefined => {
    try {
        return new Intl.DisplayNames(locale, { type: 'region' })
    } catch {
        // An unusable locale tag: the codes themselves will do.
        return undefined
    }
}

/** Every country with its name in `locale`, sorted by that name. */
export const buildCountryOptions = (locale: string): CountryOption[] => {
    const names = regionNames(locale)
    return COUNTRY_CODES.map((code) => ({
        code,
        name: names?.of(code) ?? code,
        flag: flagEmoji(code),
    })).sort((a, b) => a.name.localeCompare(b.name, safeLocale(locale)))
}

const safeLocale = (locale: string): string | undefined => {
    try {
        return Intl.getCanonicalLocales(locale)[0]
    } catch {
        return undefined
    }
}
