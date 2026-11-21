import Typography from '@mui/material/Typography'
import { memo, useMemo } from 'react'
import { Skeleton, Stack } from '@mui/material'
import CakeIcon from '@mui/icons-material/Cake'
import BirthdayItem from './BirthdayItem'
import { useGetBirthdays } from '../../apis/birthday'
import { SmallCard } from '@/shared/ui/CardFrame'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useSetting } from '@/features/settings'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

const MAX_BIRTHDAYS = 5

const BirthdaysComponent = () => {
    const { addDailyUpdateTrigger } = useTimeContext()
    const birthdayCalendarId = useSetting(
        (settings) => settings.birthdayCalendarId
    )
    const { isSignedIn } = useGoogleAuth()

    const {
        data: birthdays,
        isLoading,
        error,
        refetch,
    } = useGetBirthdays(birthdayCalendarId ?? '', MAX_BIRTHDAYS)

    useRegisterUpdateTrigger(addDailyUpdateTrigger, refetch)

    const listItems = useMemo(() => {
        if (!isSignedIn) {
            return (
                <Typography color="text.secondary">
                    Sign in with Google in Settings to see birthdays
                </Typography>
            )
        }

        if (isLoading) {
            return Array.from({ length: MAX_BIRTHDAYS }, (_, i) => (
                <Skeleton key={i} variant="rounded" />
            ))
        }

        if (error || !birthdays?.list) {
            return (
                <Typography color="text.secondary">
                    Error loading birthdays
                </Typography>
            )
        }

        return birthdays.list
            .slice(0, MAX_BIRTHDAYS)
            .map((data) => (
                <BirthdayItem item={data} key={`${data.name}-${data.date}`} />
            ))
    }, [birthdays, isLoading, error, isSignedIn])

    return (
        <SmallCard>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography color="text.primary" variant="body1" gutterBottom>
                    Birthdays
                </Typography>
                <CakeIcon fontSize="small" />
            </Stack>
            <Stack direction="column" spacing={1.5}>
                {listItems}
            </Stack>
        </SmallCard>
    )
}

export const Birthdays = memo(BirthdaysComponent)
Birthdays.displayName = 'Birthdays'

export default Birthdays
