import Typography from '@mui/material/Typography'
import { memo, useMemo } from 'react'
import { Skeleton, Stack } from '@mui/material'
import ChecklistIcon from '@mui/icons-material/Checklist'
import TaskItem from './TaskItem'
import { useGetTasks, useGetTaskLists } from '../../apis/tasks'
import { SmallCard } from '../CardFrame'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useGetUserSettings } from '../../apis/user_settings'
import { Task } from '../../models/tasks'

const MAX_TASKS = 5

const TasksComponent = () => {
    const { addDailyUpdateTrigger } = useTimeContext()
    const { data: userSettings } = useGetUserSettings(false)
    const { data: allTaskLists } = useGetTaskLists()

    // Determine which task lists to fetch from
    const taskListIdsToFetch = useMemo(() => {
        const selectedIds = userSettings?.task_list_ids || []
        // If empty, fetch from all available task lists
        if (selectedIds.length === 0 && allTaskLists) {
            return allTaskLists.map((tl) => tl.id)
        }
        return selectedIds
    }, [userSettings?.task_list_ids, allTaskLists])

    const showCompleted = userSettings?.show_completed_tasks ?? false

    // Fetch tasks from each task list
    const taskQueries = taskListIdsToFetch.map((taskListId) => {
        const params = new URLSearchParams({
            count: MAX_TASKS.toString(),
            showCompleted: showCompleted.toString(),
            tasklist_id: taskListId,
        })
        return useGetTasks(params)
    })

    // Merge all tasks from different lists
    const allTasks = useMemo(() => {
        const tasks: Task[] = []
        taskQueries.forEach((query) => {
            if (query.data?.list) {
                tasks.push(...query.data.list)
            }
        })
        // Sort by due date (tasks without due date go last)
        return tasks.sort((a, b) => {
            if (!a.due && !b.due) return 0
            if (!a.due) return 1
            if (!b.due) return -1
            return new Date(a.due).getTime() - new Date(b.due).getTime()
        })
    }, [taskQueries])

    const isLoading = taskQueries.some((q) => q.isLoading) || !userSettings
    const error = taskQueries.find((q) => q.error)?.error
    const refetch = () => taskQueries.forEach((q) => q.refetch())

    useRegisterUpdateTrigger(addDailyUpdateTrigger, refetch)

    const listItems = useMemo(() => {
        if (isLoading) {
            return Array.from({ length: MAX_TASKS }, (_, i) => (
                <Skeleton key={i} variant="rounded" />
            ))
        }

        if (error) {
            return (
                <Typography color="text.secondary">
                    Error loading tasks
                </Typography>
            )
        }

        if (allTasks.length === 0) {
            return (
                <Typography color="text.secondary">No upcoming tasks</Typography>
            )
        }

        return allTasks
            .slice(0, MAX_TASKS)
            .map((data) => <TaskItem item={data} key={data.id} />)
    }, [allTasks, isLoading, error])

    return (
        <SmallCard>
            <Stack direction="row" justifyContent="space-between">
                <Typography color="text.primary" variant="body1" gutterBottom>
                    Tasks
                </Typography>
                <ChecklistIcon fontSize="small" />
            </Stack>
            <Stack direction="column" spacing={1.5}>
                {listItems}
            </Stack>
        </SmallCard>
    )
}

export const Tasks = memo(TasksComponent)
Tasks.displayName = 'Tasks'

export default Tasks
