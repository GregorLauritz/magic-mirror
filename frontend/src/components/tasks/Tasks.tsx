import Typography from '@mui/material/Typography'
import { memo, useMemo } from 'react'
import { Skeleton, Stack } from '@mui/material'
import ChecklistIcon from '@mui/icons-material/Checklist'
import TaskItem from './TaskItem'
import { useGetTasks } from '../../apis/tasks'
import { SmallCard } from '../CardFrame'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'
import { useTimeContext } from '../../hooks/useTimeContext'

const MAX_TASKS = 5

const TasksComponent = () => {
    const { addDailyUpdateTrigger } = useTimeContext()

    const params = useMemo(
        () =>
            new URLSearchParams({
                count: MAX_TASKS.toString(),
                showCompleted: 'false',
            }),
        []
    )

    const { data: tasks, isLoading, error, refetch } = useGetTasks(params)

    useRegisterUpdateTrigger(addDailyUpdateTrigger, refetch)

    const listItems = useMemo(() => {
        if (isLoading) {
            return Array.from({ length: MAX_TASKS }, (_, i) => (
                <Skeleton key={i} variant="rounded" />
            ))
        }

        if (error || !tasks?.list) {
            return (
                <Typography color="text.secondary">
                    Error loading tasks
                </Typography>
            )
        }

        if (tasks.count === 0) {
            return (
                <Typography color="text.secondary">No upcoming tasks</Typography>
            )
        }

        return tasks.list
            .slice(0, MAX_TASKS)
            .map((data) => <TaskItem item={data} key={data.id} />)
    }, [tasks, isLoading, error])

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
