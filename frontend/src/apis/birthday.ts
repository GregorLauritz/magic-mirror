import { UseQueryResult } from 'react-query'
import { useAccessToken, useAuthenticatedQuery } from '@/features/auth'
import { ServerStateKeysEnum } from '../common/statekeys'
import { REFETCH_INTERVAL } from '../constants/api'
import { BIRTHDAY_COUNT } from '../constants/events'
import { BirthdayList } from '../models/birthdays'
import { getBirthdays } from '../services/googleCalendar'

export const useGetBirthdays = (
    calendar_id: string,
    birthday_count: number = BIRTHDAY_COUNT
): UseQueryResult<BirthdayList, Error> => {
    const getAccessToken = useAccessToken()

    return useAuthenticatedQuery<BirthdayList>(
        [ServerStateKeysEnum.birthdays, birthday_count, calendar_id],
        async () =>
            getBirthdays(await getAccessToken(), calendar_id, birthday_count),
        { refetchIntervalMs: REFETCH_INTERVAL }
    )
}
