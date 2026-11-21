import { describe, expect, it } from 'vitest'
import {
    makeCondition,
    kindFromWmoCode,
} from '@/domain/weather/WeatherCondition'
import {
    describeCondition,
    iconId,
    weatherIconUrl,
} from '@/features/weather/weatherPresentation'
import { createTestConfig } from '../../support/createTestConfig'

// OpenWeather icon base per Open-Meteo code. Every code keeps the icon the
// legacy table gave it, except 2 and 3 (B12): "partly cloudy" is the
// scattered-clouds icon (03) and "overcast" the broken-clouds icon (04); the
// legacy table showed the few-clouds icon (02) for all of 1-3.
const ICON_BASE: ReadonlyArray<readonly [number, string]> = [
    [0, '01'],
    [1, '02'],
    [2, '03'],
    [3, '04'],
    [45, '50'],
    [48, '50'],
    [51, '09'],
    [53, '09'],
    [55, '09'],
    [56, '09'],
    [57, '09'],
    [61, '10'],
    [63, '10'],
    [65, '10'],
    [66, '13'],
    [67, '13'],
    [71, '13'],
    [73, '13'],
    [75, '13'],
    [77, '13'],
    [80, '09'],
    [81, '09'],
    [82, '09'],
    [85, '13'],
    [86, '13'],
    [95, '11'],
    [96, '11'],
    [99, '11'],
]

describe('iconId', () => {
    it.each(ICON_BASE)(
        'code %i uses icon %s, with a d/n suffix',
        (code, base) => {
            const kind = kindFromWmoCode(code)

            expect(iconId(kind, true)).toBe(`${base}d`)
            expect(iconId(kind, false)).toBe(`${base}n`)
        }
    )

    it('has no icon for an unknown condition, so the local fallback is used', () => {
        expect(iconId('unknown', true)).toBeUndefined()
    })
})

describe('describeCondition', () => {
    it('describes clear sky correctly (B12: was "cloud development not observed")', () => {
        expect(describeCondition('clear')).toBe('Clear sky')
    })

    it('gives every kind a distinct, non-empty description', () => {
        const kinds = ICON_BASE.map(([code]) => kindFromWmoCode(code))
        const descriptions = new Set(
            [...kinds, 'unknown' as const].map(describeCondition)
        )

        expect(describeCondition('unknown')).toBe('Unknown weather')
        expect(descriptions.size).toBe(new Set([...kinds, 'unknown']).size)
        for (const text of descriptions) expect(text.trim()).not.toBe('')
    })
})

describe('weatherIconUrl', () => {
    it('builds the icon CDN url from the configured base and zoom', () => {
        const config = createTestConfig({ weatherIconZoom: '2x' })

        expect(weatherIconUrl(makeCondition(61, false), config)).toBe(
            'https://openweathermap.org/img/wn/10n@2x.png'
        )
    })

    it('returns undefined when the condition has no icon', () => {
        expect(
            weatherIconUrl(makeCondition(1234, true), createTestConfig())
        ).toBeUndefined()
    })
})
