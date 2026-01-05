import Typography from '@mui/material/Typography'
import { smallFontSize } from '../../assets/styles/theme'
import { useGetTime } from '../../apis/current_time'
import { SmallCard } from '../CardFrame'
import { Stack } from '@mui/material'

export const Time = () => {
    const { data: time, isLoading, error } = useGetTime()

    if (isLoading) {
        return <SmallCard>Loading...</SmallCard>
    }

    if (error || !time) {
        return <SmallCard>Error!</SmallCard>
    }

    return (
        <SmallCard>
            <Stack direction="column" spacing={1}>
                <Typography variant="subtitle2" color="text.primary">
                    {time.weekdayLong}
                </Typography>
                <Typography color="text.primary" variant="body1">
                    {time.currentDate}
                </Typography>
                <Typography variant="h3">
                    {time.hour}:{time.minute}
                </Typography>
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={smallFontSize}
                >
                    Timezone UTC{time.timezoneOffset}
                </Typography>
            </Stack>
        </SmallCard>
    )
}

export default Time
