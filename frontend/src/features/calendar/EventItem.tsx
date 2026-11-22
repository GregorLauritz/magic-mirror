import { memo } from 'react'
import { Paper, Stack, Typography } from '@mui/material'
import { PAPER_CARD_COLOR, xSmallFontSize } from '@/shared/styles/theme'
import { hideTextOverflow } from '@/shared/styles/text'

interface EventItemProps {
    readonly title: string
    readonly time: string
    readonly location: string
}

const line = { ...xSmallFontSize, ...hideTextOverflow }

/** One event as a small card: what, when, where. */
export const EventItem = memo(({ title, time, location }: EventItemProps) => (
    <Paper elevation={2} square={false} sx={{ background: PAPER_CARD_COLOR }}>
        <Stack sx={{ p: 0.5 }}>
            <Typography
                variant="subtitle2"
                color="text.primary"
                align="left"
                sx={line}
            >
                {title}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                align="left"
                sx={line}
            >
                {time}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                align="left"
                sx={line}
            >
                {location}
            </Typography>
        </Stack>
    </Paper>
))
EventItem.displayName = 'EventItem'
