import { useQuery } from 'react-query'
import { ServerStateKeysEnum } from '../common/statekeys'
import { CALENDARS_API } from '../constants/api'
import { CalendarListItem } from '../models/calendar'
import { fetchJson } from '../common/fetch'

export const useListCalendars = (enabled: boolean = true) => {
    return useQuery<CalendarListItem[], Error>({
        queryKey: [ServerStateKeysEnum.calendar_list],
        queryFn: async () =>
            fetchJson<CalendarListItem[]>(`${CALENDARS_API}`).catch((err) => {
                throw err
            }),
        refetchInterval: false,
        enabled,
    })
}
