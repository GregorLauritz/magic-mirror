export type CurrentWeatherResource = {
    latitude: number
    longitude: number
    temperature: CurrentWeatherTemperature
    windspeed: Windspeed
    weathercode: number
    update_time: string
    weather_icon: string
    description: string
    precipitation: Precipitation
}

export type CurrentWeatherTemperature = {
    current: number
    min: number
    max: number
    feels_like: number
    unit: string
}

export type Precipitation = {
    value: number
    unit: string
}

export type Windspeed = {
    value: number
    unit: string
}
