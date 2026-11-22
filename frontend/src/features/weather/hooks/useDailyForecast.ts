import { useQuery } from 'react-query'
import { useServices } from '@/app/services/useServices'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { DailyEntry } from '@/domain/weather/types'
import { useTimeZone, useToday } from '@/features/time'
import { useInvalidateOnChange } from '@/shared/hooks/useInvalidateOnChange'
import { DAILY_FORECAST_DAYS } from '../constants'
import { weatherKeys } from '../weatherKeys'

export interface DailyForecastState {
    /** The days after today, or undefined until the first load succeeded. */
    readonly days: readonly DailyEntry[] | undefined
    readonly isLoading: boolean
    readonly isError: boolean
}

export const useDailyForecast = (
    coordinates: Coordinates
): DailyForecastState => {
    const { weather, config } = useServices()
    const timeZone = useTimeZone()
    const queryKey = weatherKeys.daily(
        coordinates,
        timeZone,
        DAILY_FORECAST_DAYS
    )

    const query = useQuery<readonly DailyEntry[], Error>(
        queryKey,
        ({ signal }) =>
            weather.getDaily(coordinates, DAILY_FORECAST_DAYS, signal),
        { refetchInterval: config.refreshIntervalMs }
    )
    // "The next days" is relative to today: after midnight the list shifts.
    useInvalidateOnChange(useToday(), queryKey)

    return {
        days: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}
