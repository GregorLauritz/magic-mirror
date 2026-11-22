export type WeatherKind =
    | 'clear'
    | 'mainly-clear'
    | 'partly-cloudy'
    | 'overcast'
    | 'fog'
    | 'drizzle'
    | 'freezing-drizzle'
    | 'rain'
    | 'freezing-rain'
    | 'snow'
    | 'snow-grains'
    | 'rain-showers'
    | 'snow-showers'
    | 'thunderstorm'
    | 'thunderstorm-hail'
    | 'unknown'

// The WMO weather interpretation codes that Open-Meteo documents (28 of the
// 100 SYNOP "ww" codes). Intensity (slight/moderate/heavy) is intentionally
// not part of the kind: nothing in the UI distinguishes it.
const KIND_BY_CODE: ReadonlyMap<number, WeatherKind> = new Map<
    number,
    WeatherKind
>([
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
])

export const kindFromWmoCode = (code: number): WeatherKind =>
    KIND_BY_CODE.get(code) ?? 'unknown'

export interface WeatherCondition {
    /** The raw WMO code as delivered by the provider. */
    readonly code: number
    readonly kind: WeatherKind
    readonly isDay: boolean
}

export const makeCondition = (
    code: number,
    isDay: boolean
): WeatherCondition => ({
    code,
    kind: kindFromWmoCode(code),
    isDay,
})
