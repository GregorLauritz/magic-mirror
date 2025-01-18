import { useQuery } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { REFETCH_INTERVAL, WEATHER_API } from '../constants/api'
import { LATITUDE, LONGITUDE } from '../constants/weather'
import { CurrentWeatherResource } from '../models/current_weather'

export const useGetCurrentWeather = (
    longitude: number = LONGITUDE,
    latitude: number = LATITUDE,
    enabled: boolean = true,
    timeZone: string = 'GMT'
) =>
    useQuery<CurrentWeatherResource, Error>({
        queryKey: [
            ServerStateKeysEnum.current_weather,
            longitude,
            latitude,
            timeZone,
        ],
        queryFn: async () => {
            const params = new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                timezone: timeZone,
            })
            return fetchJson<CurrentWeatherResource>(
                `${WEATHER_API}/current?${params.toString()}`
            ).catch((err) => {
                throw err
            })
        },
        refetchInterval: REFETCH_INTERVAL,
        enabled,
    })
