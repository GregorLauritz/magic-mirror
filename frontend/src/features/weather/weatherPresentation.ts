import type {
    WeatherCondition,
    WeatherKind,
} from '@/domain/weather/WeatherCondition'

// OpenWeatherMap icon numbers (https://openweathermap.org/weather-conditions).
// Same icon per family as the legacy table, except partly cloudy (03) and
// overcast (04), which used to share the few-clouds icon (02) with "mainly
// clear".
const ICON_NUMBER: Record<WeatherKind, string | undefined> = {
    clear: '01',
    'mainly-clear': '02',
    'partly-cloudy': '03',
    overcast: '04',
    fog: '50',
    drizzle: '09',
    'freezing-drizzle': '09',
    rain: '10',
    'freezing-rain': '13',
    snow: '13',
    'snow-grains': '13',
    'rain-showers': '09',
    'snow-showers': '13',
    thunderstorm: '11',
    'thunderstorm-hail': '11',
    unknown: undefined,
}

const DESCRIPTION: Record<WeatherKind, string> = {
    clear: 'Clear sky',
    'mainly-clear': 'Mainly clear',
    'partly-cloudy': 'Partly cloudy',
    overcast: 'Overcast',
    fog: 'Fog',
    drizzle: 'Drizzle',
    'freezing-drizzle': 'Freezing drizzle',
    rain: 'Rain',
    'freezing-rain': 'Freezing rain',
    snow: 'Snow',
    'snow-grains': 'Snow grains',
    'rain-showers': 'Rain showers',
    'snow-showers': 'Snow showers',
    thunderstorm: 'Thunderstorm',
    'thunderstorm-hail': 'Thunderstorm with hail',
    unknown: 'Unknown weather',
}

export const iconId = (
    kind: WeatherKind,
    isDay: boolean
): string | undefined => {
    const number = ICON_NUMBER[kind]
    return number === undefined ? undefined : `${number}${isDay ? 'd' : 'n'}`
}

export const describeCondition = (kind: WeatherKind): string =>
    DESCRIPTION[kind]

interface IconSettings {
    readonly weatherIconBaseUrl: string
    readonly weatherIconZoom: '2x' | '4x'
}

/** The icon CDN url for a condition, or undefined if it has no icon. */
export const weatherIconUrl = (
    condition: WeatherCondition,
    settings: IconSettings
): string | undefined => {
    const id = iconId(condition.kind, condition.isDay)
    return id === undefined
        ? undefined
        : `${settings.weatherIconBaseUrl}/img/wn/${id}@${settings.weatherIconZoom}.png`
}
