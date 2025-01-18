import { useQuery } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { REFETCH_INTERVAL, WEATHER_API } from '../constants/api'
import { LATITUDE, LONGITUDE, DAILY_FORECAST_DAYS } from '../constants/weather'
import { DailyWeatherObject } from '../models/daily_forecast'

export const useGetDailyWeather = (
    longitude: number = LONGITUDE,
    latitude: number = LATITUDE,
    forecast_days: number = DAILY_FORECAST_DAYS,
    enabled: boolean = true,
    timeZone: string = 'GMT'
) =>
    useQuery<DailyWeatherObject, Error>({
        queryKey: [
            ServerStateKeysEnum.daily_weather,
            longitude,
            latitude,
            forecast_days,
            timeZone,
        ],
        enabled,
        queryFn: async () => {
            const params = new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                days: forecast_days.toString(),
                timezone: timeZone,
            })
            return fetchJson<DailyWeatherObject>(
                `${WEATHER_API}/forecast?${params.toString()}`
            ).catch((err) => {
                throw err
            })
        },
        refetchInterval: REFETCH_INTERVAL,
    })
