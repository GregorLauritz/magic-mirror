import Typography from '@mui/material/Typography'
import { useGetTime } from '../../apis/current_time'
import { SmallCard } from '../CardFrame'
import { Stack } from '@mui/material'
import { memo } from 'react'

const TimeComponent = () => {
    const { data: time, isLoading, error } = useGetTime()

    if (isLoading) {
        return (
            <SmallCard>
                <Typography color="text.secondary">Loading...</Typography>
            </SmallCard>
        )
    }

    if (error || !time) {
        return (
            <SmallCard>
                <Typography color="text.secondary">
                    Error loading time
                </Typography>
            </SmallCard>
        )
    }

    return (
        <SmallCard>
            <Stack direction="column" spacing={1.5}>
                <Typography variant="subtitle2" color="text.primary">
                    {time.weekdayLong}
                </Typography>
                <Typography color="text.primary" variant="body1">
                    {time.currentDate}
                </Typography>
                <Typography
                    variant="h2"
                    sx={{
                        fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                        fontWeight: 500,
                        lineHeight: 1.2,
                    }}
                >
                    {time.hour}:{time.minute}:{time.seconds}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                    Timezone UTC{time.timezoneOffset}
                </Typography>
            </Stack>
        </SmallCard>
    )
}

export const Time = memo(TimeComponent)
Time.displayName = 'Time'

export default Time
