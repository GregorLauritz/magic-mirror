import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { EVENTS_API, REFETCH_INTERVAL } from '../constants/api'
import { CalendarEventList } from '../models/calendar'

export const useGetEvents = (
    query_params: URLSearchParams
): UseQueryResult<CalendarEventList, Error> => {
    return useQuery<CalendarEventList, Error>({
        queryKey: [ServerStateKeysEnum.events, query_params.toString()],
        queryFn: async (): Promise<CalendarEventList> =>
            fetchJson<CalendarEventList>(
                `${EVENTS_API}?${query_params.toString()}`
            ),
        refetchInterval: REFETCH_INTERVAL,
    })
}

export const useGetDateEvents = (
    calendar_id: string,
    date: string
): UseQueryResult<CalendarEventList, Error> => {
    return useQuery<CalendarEventList, Error>({
        queryKey: [ServerStateKeysEnum.events_day, date],
        queryFn: async (): Promise<CalendarEventList> =>
            fetchJson<CalendarEventList>(
                `${EVENTS_API}/${date}?cal_id=${calendar_id}`
            ),
        refetchInterval: REFETCH_INTERVAL,
    })
}
