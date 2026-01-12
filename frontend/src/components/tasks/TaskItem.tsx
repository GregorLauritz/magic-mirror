import { Typography, Paper, Stack, Box } from '@mui/material'
import { Task } from '../../models/tasks'
import { PAPER_CARD_COLOR, xSmallFontSize } from '../../assets/styles/theme'
import { memo, useMemo } from 'react'
import { hideTextOverflow } from '../../assets/styles/coloredBox'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'

interface TaskItemProps {
    item: Task
}

const TaskItem = memo<TaskItemProps>(({ item }) => {
    const isCompleted = item.status === 'completed'
    const hasDueDate = Boolean(item.due)

    const dueText = useMemo(() => {
        if (!item.due) return ''
        const dueDate = new Date(item.due)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)

        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'today'
        if (diffDays === 1) return 'tomorrow'
        if (diffDays === -1) return 'yesterday'
        if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
        return `${diffDays}d`
    }, [item.due])

    const color = useMemo(() => {
        if (isCompleted) return 'text.secondary'
        if (!item.due) return 'text.primary'

        const dueDate = new Date(item.due)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)

        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return 'error.main'
        if (diffDays === 0) return 'warning.main'
        return 'text.primary'
    }, [item.due, isCompleted])

    return (
        <Paper
            elevation={2}
            square={false}
            sx={{
                background: PAPER_CARD_COLOR,
                padding: 0.5,
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                whiteSpace="nowrap"
                overflow="hidden"
            >
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                    {isCompleted ? (
                        <CheckCircleOutlineIcon
                            sx={{ fontSize: xSmallFontSize, color: 'text.secondary' }}
                        />
                    ) : (
                        <RadioButtonUncheckedIcon
                            sx={{ fontSize: xSmallFontSize, color }}
                        />
                    )}
                </Box>
                <Typography
                    color={color}
                    fontSize={xSmallFontSize}
                    sx={{
                        ...hideTextOverflow,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        flex: 1,
                    }}
                >
                    {item.title}
                </Typography>
                {hasDueDate && (
                    <Typography
                        color={color}
                        fontSize={xSmallFontSize}
                        sx={{ minWidth: 'fit-content' }}
                    >
                        {dueText}
                    </Typography>
                )}
            </Stack>
        </Paper>
    )
})

TaskItem.displayName = 'TaskItem'

export default TaskItem
