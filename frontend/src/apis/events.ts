import { UseQueryResult } from 'react-query'
import { useAccessToken, useAuthenticatedQuery } from '@/features/auth'
import { ServerStateKeysEnum } from '../common/statekeys'
import { REFETCH_INTERVAL } from '../constants/api'
import { CalendarEventList } from '../models/calendar'
import { getEvents } from '../services/googleCalendar'

const DEFAULT_EVENT_COUNT = 100

export const useGetEvents = (
    query_params: URLSearchParams
): UseQueryResult<CalendarEventList, Error> => {
    const getAccessToken = useAccessToken()

    return useAuthenticatedQuery<CalendarEventList>(
        [ServerStateKeysEnum.events, query_params.toString()],
        async (): Promise<CalendarEventList> => {
            const accessToken = await getAccessToken()
            const minTime =
                query_params.get('minTime') ?? new Date().toISOString()
            const maxTime = query_params.get('maxTime') ?? undefined
            const calId = query_params.get('cal_id') || 'primary'
            const count = parseInt(
                query_params.get('count') ?? String(DEFAULT_EVENT_COUNT)
            )
            return getEvents(accessToken, calId, minTime, maxTime, count)
        },
        { refetchIntervalMs: REFETCH_INTERVAL }
    )
}
