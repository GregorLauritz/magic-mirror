import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useServices } from '@/app/services/useServices'
import type { Coordinates } from '@/domain/location/Coordinates'
import { upcomingHours } from '@/domain/weather/forecastWindow'
import type { HourlyEntry } from '@/domain/weather/types'
import { useHourKey, useNow, useTimeZone } from '@/features/time'
import { useInvalidateOnChange } from '@/shared/hooks/useInvalidateOnChange'
import { HOURLY_FORECAST_HOURS } from '../constants'
import { weatherKeys } from '../weatherKeys'

export interface HourlyForecastState {
    /** The next few hours, or undefined until the first load succeeded. */
    readonly entries: readonly HourlyEntry[] | undefined
    readonly isLoading: boolean
    readonly isError: boolean
}

export const useHourlyForecast = (
    coordinates: Coordinates
): HourlyForecastState => {
    const { weather, config } = useServices()
    const timeZone = useTimeZone()
    const now = useNow()
    const queryKey = weatherKeys.hourly(coordinates, timeZone)

    const query = useQuery<readonly HourlyEntry[], Error>(
        queryKey,
        ({ signal }) => weather.getHourly(coordinates, signal),
        { refetchInterval: config.refreshIntervalMs }
    )
    // A fresh hour needs fresh data (the fetched list ends ~48h ahead).
    useInvalidateOnChange(useHourKey(), queryKey)

    // The window slides with the clock; it is cut here, not at fetch time, so
    // it advances every minute without another request.
    const entries = useMemo(
        () =>
            query.data && upcomingHours(query.data, now, HOURLY_FORECAST_HOURS),
        [query.data, now]
    )

    return { entries, isLoading: query.isLoading, isError: query.isError }
}
