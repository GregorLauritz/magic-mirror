import { memo, type ReactNode } from 'react'
import CakeIcon from '@mui/icons-material/Cake'
import { Skeleton, Stack, Typography } from '@mui/material'
import { daysUntil } from '@/domain/calendar/birthdayRules'
import { useSetting } from '@/features/settings'
import { useToday } from '@/features/time'
import { SmallCard } from '@/shared/ui/CardFrame'
import { BirthdayItem } from './BirthdayItem'
import { BIRTHDAY_LIMIT } from './constants'
import { useBirthdays } from './hooks/useBirthdays'
import { useCalendarAccess } from './useCalendarAccess'
import { RENEW_MESSAGE, widgetView } from './widgetView'

const Notice = ({ children }: { children: ReactNode }) => (
    <Typography color="text.secondary">{children}</Typography>
)

const BirthdaysComponent = () => {
    const calendarId = useSetting((settings) => settings.birthdayCalendarId)
    const { birthdays, isConfigured, isError } = useBirthdays(calendarId)
    const access = useCalendarAccess()
    const today = useToday()

    const view = widgetView({
        access,
        hasData: birthdays !== undefined,
        isError,
    })

    let content: ReactNode
    if (view === 'sign-in') {
        content = (
            <Notice>Sign in with Google in Settings to see birthdays</Notice>
        )
    } else if (!isConfigured) {
        content = <Notice>Choose a birthday calendar in Settings</Notice>
    } else if (view === 'renew') {
        content = <Notice>{RENEW_MESSAGE}</Notice>
    } else if (view === 'error') {
        content = <Notice>Error loading birthdays</Notice>
    } else if (view === 'loading') {
        content = Array.from({ length: BIRTHDAY_LIMIT }, (_, index) => (
            <Skeleton key={index} variant="rounded" />
        ))
    } else if (birthdays?.length === 0) {
        content = <Notice>No upcoming birthdays</Notice>
    } else {
        content = birthdays
            ?.slice(0, BIRTHDAY_LIMIT)
            .map((birthday) => (
                <BirthdayItem
                    key={`${birthday.name}-${birthday.date}`}
                    name={birthday.name}
                    daysAway={daysUntil(today, birthday.date)}
                />
            ))
    }

    return (
        <SmallCard>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography color="text.primary" variant="body1" gutterBottom>
                    Birthdays
                </Typography>
                <CakeIcon fontSize="small" />
            </Stack>
            <Stack direction="column" spacing={1.5}>
                {content}
            </Stack>
        </SmallCard>
    )
}

export const BirthdaysWidget = memo(BirthdaysComponent)
BirthdaysWidget.displayName = 'BirthdaysWidget'
