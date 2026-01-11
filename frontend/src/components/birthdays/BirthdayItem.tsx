import { Typography, Paper, Stack } from '@mui/material'
import { Birthday } from '../../models/birthdays'
import { PAPER_CARD_COLOR, xSmallFontSize } from '../../assets/styles/theme'
import { memo, useMemo } from 'react'
import { getDifferenceInDays } from '../../common/dateParser'
import { hideTextOverflow } from '../../assets/styles/coloredBox'
import { useTimeContext } from '../../hooks/useTimeContext'

interface BirthdayItemProps {
    item: Birthday
}

const getFontWeight = (days: number): 'bold' | 'normal' => {
    return days === 0 ? 'bold' : 'normal'
}

const getColor = (days: number): 'text.primary' | 'text.secondary' => {
    return days === 0 ? 'text.primary' : 'text.secondary'
}

const getTimeText = (days: number): string => {
    if (days === 0) return 'today'
    if (days === 1) return 'tomorrow'
    return `${days} days`
}

const BirthdayItem = memo<BirthdayItemProps>(({ item }) => {
    const { currentDate } = useTimeContext()

    const days = useMemo(() => {
        const bday = new Date(item.date)
        const today = new Date(currentDate.toDateString())
        return getDifferenceInDays(today, bday)
    }, [item.date, currentDate])

    const fontWeight = useMemo(() => getFontWeight(days), [days])
    const color = useMemo(() => getColor(days), [days])
    const timeText = useMemo(() => getTimeText(days), [days])

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
                whiteSpace="nowrap"
                overflow="hidden"
                justifyContent="space-between"
            >
                <Typography
                    color={color}
                    fontWeight={fontWeight}
                    fontSize={xSmallFontSize}
                    sx={hideTextOverflow}
                >
                    {item.name}
                </Typography>
                <Typography
                    color={color}
                    fontWeight={fontWeight}
                    fontSize={xSmallFontSize}
                >
                    {timeText}
                </Typography>
            </Stack>
        </Paper>
    )
})

BirthdayItem.displayName = 'BirthdayItem'

export default BirthdayItem
