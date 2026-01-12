import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { TASKS_API, TASK_LISTS_API, REFETCH_INTERVAL } from '../constants/api'
import { TaskList, TaskListItem } from '../models/tasks'

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

export const useGetTaskLists = (): UseQueryResult<
    TaskListItem[],
    Error
> => {
    return useQuery<TaskListItem[], Error>({
        queryKey: [ServerStateKeysEnum.task_lists],
        queryFn: async (): Promise<TaskListItem[]> =>
            fetchJson<TaskListItem[]>(TASK_LISTS_API),
    })
}
