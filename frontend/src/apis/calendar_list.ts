import { UseQueryResult } from 'react-query'
import { useAccessToken, useAuthenticatedQuery } from '@/features/auth'
import { ServerStateKeysEnum } from '../common/statekeys'
import { CalendarListItem } from '../models/calendar'
import { getCalendarList } from '../services/googleCalendar'

export const useListCalendars = (
    enabled: boolean = true
): UseQueryResult<CalendarListItem[], Error> => {
    const getAccessToken = useAccessToken()

    return useAuthenticatedQuery<CalendarListItem[]>(
        [ServerStateKeysEnum.calendar_list],
        async () => getCalendarList(await getAccessToken()),
        { enabled }
    )
}
