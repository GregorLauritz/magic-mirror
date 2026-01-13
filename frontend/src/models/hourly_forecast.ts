export type HourlyWeatherObject = {
    latitude: number
    longitude: number
    timezone: string
    forecast: Array<HourlyWeatherResource>
}

export type HourlyWeatherResource = {
    time: string
    temperature: HourlyTemperature
    precipitation: HourlyPrecipitation
    weather_icon: string
    weathercode: number
    description: string
    windspeed: HourlyWindspeed
}

export type HourlyTemperature = {
    value: number
    unit: string
}

export type HourlyPrecipitation = {
    value: number
    unit: string
}

export type HourlyWindspeed = {
    value: number
    unit: string
}
