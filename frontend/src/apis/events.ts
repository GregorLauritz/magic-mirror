import { useQuery, UseQueryResult } from 'react-query'
import { ServerStateKeysEnum } from '../common/statekeys'
import { REFETCH_INTERVAL } from '../constants/api'
import { CalendarEventList } from '../models/calendar'
import { getAccessToken } from '../services/googleAuth'
import { getEvents } from '../services/googleCalendar'
import { useGoogleAuth } from '../hooks/useGoogleAuth'

const DEFAULT_EVENT_COUNT = 100

export const useGetEvents = (
    query_params: URLSearchParams
): UseQueryResult<CalendarEventList, Error> => {
    const { isSignedIn } = useGoogleAuth()

    return useQuery<CalendarEventList, Error>({
        queryKey: [ServerStateKeysEnum.events, query_params.toString()],
        queryFn: async (): Promise<CalendarEventList> => {
            const accessToken = await getAccessToken()
            if (!accessToken) {
                throw new Error('Not signed in with Google')
            }
            const minTime =
                query_params.get('minTime') ?? new Date().toISOString()
            const maxTime = query_params.get('maxTime') ?? undefined
            const calId = query_params.get('cal_id') || 'primary'
            const count = parseInt(
                query_params.get('count') ?? String(DEFAULT_EVENT_COUNT)
            )
            return getEvents(accessToken, calId, minTime, maxTime, count)
        },
        refetchInterval: REFETCH_INTERVAL,
        enabled: isSignedIn,
    })
}
