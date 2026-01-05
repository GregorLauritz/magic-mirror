import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { REFETCH_INTERVAL, WEATHER_API } from '../constants/api'
import {
    LATITUDE,
    LONGITUDE,
    HOURLY_FORECAST_HOURS,
} from '../constants/weather'
import { HourlyWeatherObject } from '../models/hourly_forecast'

export const useGetHourlyWeather = (
    longitude: number = LONGITUDE,
    latitude: number = LATITUDE,
    forecast_hours: number = HOURLY_FORECAST_HOURS,
    enabled: boolean = true,
    timeZone: string = 'GMT'
): UseQueryResult<HourlyWeatherObject, Error> =>
    useQuery<HourlyWeatherObject, Error>({
        queryKey: [
            ServerStateKeysEnum.hourly_weather,
            longitude,
            latitude,
            forecast_hours,
            timeZone,
        ],
        enabled,
        queryFn: async (): Promise<HourlyWeatherObject> => {
            const params = new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                hours: forecast_hours.toString(),
                timezone: timeZone,
            })
            return fetchJson<HourlyWeatherObject>(
                `${WEATHER_API}/hourly?${params.toString()}`
            )
        },
        refetchInterval: REFETCH_INTERVAL,
    })
