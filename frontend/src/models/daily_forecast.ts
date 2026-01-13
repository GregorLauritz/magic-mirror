export type DailyWeatherObject = {
    latitude: number
    longitude: number
    timezone: string
    days: number
    forecast: Array<WeatherForecastResource>
}

export type WeatherForecastResource = {
    date: string
    temperature: Temperature
    precipitation: Precipitation
    weather_icon: string
    sunrise: string
    sunset: string
    weathercode: number
    description: string
    max_wind_speed: Windspeed
}

export type Windspeed = {
    value: number
    unit: string
}

export type Precipitation = {
    amount: number
    hours: number
    amount_unit: string
}

export type Temperature = {
    min: number
    max: number
    unit: string
}
