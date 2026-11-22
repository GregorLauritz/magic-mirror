import { useQuery, type UseQueryResult } from 'react-query'
import { useServices } from '@/app/services/useServices'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { CurrentWeather } from '@/domain/weather/types'
import { useTimeZone } from '@/features/time'
import { weatherKeys } from '../weatherKeys'

export const useCurrentWeather = (
    coordinates: Coordinates
): UseQueryResult<CurrentWeather, Error> => {
    const { weather, config } = useServices()
    const timeZone = useTimeZone()

    return useQuery<CurrentWeather, Error>(
        weatherKeys.current(coordinates, timeZone),
        ({ signal }) => weather.getCurrent(coordinates, signal),
        { refetchInterval: config.refreshIntervalMs }
    )
}
