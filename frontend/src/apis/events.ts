import { useQuery } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { EVENTS_API, REFETCH_INTERVAL } from '../constants/api'
import { CalendarEventList } from '../models/calendar'

export const useGetEvents = (query_params: URLSearchParams) => {
    return useQuery<CalendarEventList, Error>({
        queryKey: [ServerStateKeysEnum.events, query_params.toString()],
        queryFn: async () =>
            fetchJson<CalendarEventList>(
                `${EVENTS_API}?${query_params.toString()}`
            ).catch((err) => {
                throw err
            }),
        refetchInterval: REFETCH_INTERVAL,
    })
}

export const useGetDateEvents = (calendar_id: string, date: string) => {
    return useQuery<CalendarEventList, Error>({
        queryKey: [ServerStateKeysEnum.events_day, date],
        queryFn: async () =>
            fetchJson<CalendarEventList>(
                `${EVENTS_API}/${date}?cal_id=${calendar_id}`
            ).catch((err) => {
                throw err
            }),
        refetchInterval: REFETCH_INTERVAL,
    })
}
