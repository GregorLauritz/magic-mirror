import { memo } from 'react'
import { Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import { smallFontSize } from '@/shared/styles/theme'
import { SmallCard } from '@/shared/ui/CardFrame'
import { useClockDisplay } from './useClockDisplay'

const ClockWidgetComponent = () => {
    const clock = useClockDisplay()

    return (
        <SmallCard>
            <Stack direction="column" spacing={1.5}>
                <Typography variant="subtitle2" color="text.primary">
                    {clock.weekday}
                </Typography>
                <Typography color="text.primary" variant="body1">
                    {clock.date}
                </Typography>
                <Typography variant="h2">
                    {clock.hour}:{clock.minute}
                </Typography>
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={smallFontSize}
                >
                    Timezone UTC{clock.utcOffset}
                </Typography>
            </Stack>
        </SmallCard>
    )
}

export const ClockWidget = memo(ClockWidgetComponent)
ClockWidget.displayName = 'ClockWidget'
