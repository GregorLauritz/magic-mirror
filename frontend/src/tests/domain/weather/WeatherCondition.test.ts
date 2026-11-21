import { describe, expect, it } from 'vitest'
import {
    kindFromWmoCode,
    makeCondition,
    type WeatherKind,
} from '@/domain/weather/WeatherCondition'

// The 28 codes Open-Meteo documents (WMO "present weather" subset), each with
// the kind it must resolve to. B12: the legacy table was the SYNOP "ww" code
// list, which describes code 0 as "cloud development not observed".
const OPEN_METEO_CODES: ReadonlyArray<readonly [number, WeatherKind]> = [
    [0, 'clear'],
    [1, 'mainly-clear'],
    [2, 'partly-cloudy'],
    [3, 'overcast'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'drizzle'],
    [53, 'drizzle'],
    [55, 'drizzle'],
    [56, 'freezing-drizzle'],
    [57, 'freezing-drizzle'],
    [61, 'rain'],
    [63, 'rain'],
    [65, 'rain'],
    [66, 'freezing-rain'],
    [67, 'freezing-rain'],
    [71, 'snow'],
    [73, 'snow'],
    [75, 'snow'],
    [77, 'snow-grains'],
    [80, 'rain-showers'],
    [81, 'rain-showers'],
    [82, 'rain-showers'],
    [85, 'snow-showers'],
    [86, 'snow-showers'],
    [95, 'thunderstorm'],
    [96, 'thunderstorm-hail'],
    [99, 'thunderstorm-hail'],
]

describe('kindFromWmoCode', () => {
    it('covers all 28 Open-Meteo codes', () => {
        expect(OPEN_METEO_CODES).toHaveLength(28)
        for (const [code] of OPEN_METEO_CODES) {
            expect(kindFromWmoCode(code)).not.toBe('unknown')
        }
    })

    it.each(OPEN_METEO_CODES)('maps code %i to %s', (code, kind) => {
        expect(kindFromWmoCode(code)).toBe(kind)
    })

    it.each([4, 10, 44, 100, -1, 1.5, Number.NaN])(
        'treats the unmapped code %s as unknown',
        (code) => {
            expect(kindFromWmoCode(code)).toBe('unknown')
        }
    )
})

describe('makeCondition', () => {
    it('combines the code, its kind and whether it is daytime', () => {
        expect(makeCondition(61, false)).toEqual({
            code: 61,
            kind: 'rain',
            isDay: false,
        })
    })
})
