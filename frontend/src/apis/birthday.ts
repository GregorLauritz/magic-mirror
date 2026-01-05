import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { BIRHTDAY_API, REFETCH_INTERVAL } from '../constants/api'
import { BIRTHDAY_COUNT } from '../constants/events'
import { BirthdayList } from '../models/birthdays'

export const useGetBirthdays = (
    calendar_id: string,
    birthday_count: number = BIRTHDAY_COUNT
): UseQueryResult<BirthdayList, Error> =>
    useQuery<BirthdayList, Error>({
        queryKey: [ServerStateKeysEnum.birthdays, birthday_count, calendar_id],
        queryFn: async (): Promise<BirthdayList> => {
            const params = new URLSearchParams({
                cal_id: calendar_id,
                count: String(birthday_count),
            })
            return fetchJson<BirthdayList>(
                `${BIRHTDAY_API}?${params.toString()}`
            )
        },
        refetchInterval: REFETCH_INTERVAL,
    })
