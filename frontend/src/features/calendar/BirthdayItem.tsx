import { memo } from 'react'
import { Paper, Stack, Typography } from '@mui/material'
import { PAPER_CARD_COLOR, xSmallFontSize } from '@/shared/styles/theme'
import { hideTextOverflow } from '@/shared/styles/text'

const whenText = (daysAway: number): string => {
    if (daysAway === 0) return 'today'
    if (daysAway === 1) return 'tomorrow'
    return `${daysAway} days`
}

/** One birthday as a small card; today's is highlighted. */
export const BirthdayItem = memo(
    ({ name, daysAway }: { name: string; daysAway: number }) => {
        const isToday = daysAway === 0
        const color = isToday ? 'text.primary' : 'text.secondary'
        const fontWeight = isToday ? 'bold' : 'normal'

        return (
            <Paper
                elevation={2}
                square={false}
                sx={{ background: PAPER_CARD_COLOR, padding: 0.5 }}
            >
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography
                        color={color}
                        sx={{
                            fontWeight,
                            ...xSmallFontSize,
                            ...hideTextOverflow,
                        }}
                    >
                        {name}
                    </Typography>
                    <Typography
                        color={color}
                        sx={{ fontWeight, ...xSmallFontSize }}
                    >
                        {whenText(daysAway)}
                    </Typography>
                </Stack>
            </Paper>
        )
    }
)
BirthdayItem.displayName = 'BirthdayItem'
