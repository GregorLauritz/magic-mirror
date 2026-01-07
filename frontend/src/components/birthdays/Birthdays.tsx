import Typography from '@mui/material/Typography'
import { memo, useMemo } from 'react'
import { Skeleton, Stack } from '@mui/material'
import CakeIcon from '@mui/icons-material/Cake'
import BirthdayItem from './BirthdayItem'
import { useGetBirthdays } from '../../apis/birthday'
import { SmallCard } from '../CardFrame'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useGetUserSettings } from '../../apis/user_settings'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

const MAX_BIRTHDAYS = 5

const BirthdaysComponent = () => {
    const { addDailyUpdateTrigger } = useTimeContext()
    const { data: userSettings } = useGetUserSettings(false)

    const {
        data: birthdays,
        isLoading,
        error,
        refetch,
    } = useGetBirthdays(userSettings?.birthday_cal_id ?? '', MAX_BIRTHDAYS)

    useRegisterUpdateTrigger(addDailyUpdateTrigger, refetch)

    const listItems = useMemo(() => {
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
    }, [birthdays, isLoading, error])

    return (
        <SmallCard>
            <Stack direction="row" justifyContent="space-between">
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
