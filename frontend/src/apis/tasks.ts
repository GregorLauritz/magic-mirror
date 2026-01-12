import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { TASKS_API, REFETCH_INTERVAL } from '../constants/api'
import { TaskList } from '../models/tasks'

export const useGetTasks = (
    query_params: URLSearchParams
): UseQueryResult<TaskList, Error> => {
    return useQuery<TaskList, Error>({
        queryKey: [ServerStateKeysEnum.tasks, query_params.toString()],
        queryFn: async (): Promise<TaskList> =>
            fetchJson<TaskList>(`${TASKS_API}?${query_params.toString()}`),
        refetchInterval: REFETCH_INTERVAL,
    })
}
