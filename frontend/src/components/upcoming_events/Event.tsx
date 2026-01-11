import Typography from '@mui/material/Typography'
import { memo, useMemo } from 'react'
import {
    getLocaleDateString,
    getTimeDifferenceInHours,
    getTimeFromDate,
    isSameDate,
} from '../../common/dateParser'
import { PAPER_CARD_COLOR, xSmallFontSize } from '../../assets/styles/theme'
import { CalendarEvent } from '../../models/calendar'
import { DEFAULT_LOCALE } from '../../constants/defaults'
import { hideTextOverflow } from '../../assets/styles/coloredBox'
import { Paper, Stack } from '@mui/material'

interface EventProps {
    item: CalendarEvent
    date: Date
}

const EventComponent = ({ item, date }: EventProps) => {
    const localeStrOpts: Intl.DateTimeFormatOptions = useMemo(
        () => ({
            month: 'short',
            day: 'numeric',
        }),
        []
    )

    const eventTime = useMemo(
        () => getEventTime({ item, date }, localeStrOpts),
        [item, date, localeStrOpts]
    )

    return (
        <Paper
            elevation={2}
            square={false}
            sx={{ background: PAPER_CARD_COLOR }}
        >
            <Stack p={0.5}>
                <Typography
                    variant="subtitle2"
                    color="text.primary"
                    align="left"
                    sx={{ ...xSmallFontSize, ...hideTextOverflow }}
                >
                    {item.summary ?? ''}
                </Typography>
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    align="left"
                    sx={{ ...xSmallFontSize, ...hideTextOverflow }}
                >
                    {eventTime}
                </Typography>
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    align="left"
                    sx={{ ...xSmallFontSize, ...hideTextOverflow }}
                >
                    {item.location ?? ''}
                </Typography>
            </Stack>
        </Paper>
    )
}

const getEventTime = (
    { item, date }: EventProps,
    localeStrOpts: Intl.DateTimeFormatOptions
): string => {
    if (item.allDay && !item.multiDays) {
        return 'All day'
    }

    if (item.allDay && item.multiDays) {
        return handleMultiFullDayEvent({ item, date }, localeStrOpts)
    }

    return handleNormalEvent({ item, date }, localeStrOpts)
}

const handleMultiFullDayEvent = (
    { item, date }: EventProps,
    localeStrOpts: Intl.DateTimeFormatOptions
): string => {
    const startDate = new Date(item.start)
    const endDate = new Date(item.end)
    endDate.setSeconds(endDate.getSeconds() - 1)
    localeStrOpts = { ...localeStrOpts, ...{ timeZone: 'UTC' } }
    const startLocaleDateStr = getLocaleDateString(
        startDate,
        DEFAULT_LOCALE,
        localeStrOpts
    )
    const endLocaleDateStr = getLocaleDateString(
        endDate,
        DEFAULT_LOCALE,
        localeStrOpts
    )
    let eventTime = `${startLocaleDateStr}-${endLocaleDateStr}`

    if (!item.merged) {
        const days = Math.ceil(
            getTimeDifferenceInHours(startDate, endDate) / 24
        )
        const hoursSinceStart = getTimeDifferenceInHours(startDate, date)
        const daysSinceStart = Math.ceil(hoursSinceStart / 24)
        eventTime = `${eventTime} (${daysSinceStart}/${days})`
    }
    return eventTime
}

const handleNormalEvent = (
    { item, date }: EventProps,
    localeStrOpts: Intl.DateTimeFormatOptions
): string => {
    const startDate = new Date(item.start)
    const endDate = new Date(item.end)
    const sameStartDate = isSameDate(date, startDate)
    const thisDate = sameStartDate ? startDate : new Date()
    const eventTimeDiff = getTimeDifferenceInHours(thisDate, endDate)
    const endsAnotherDay = eventTimeDiff >= 24

    const startLocaleDateStr = getLocaleDateString(
        startDate,
        DEFAULT_LOCALE,
        localeStrOpts
    )
    const endLocaleDateStr = getLocaleDateString(
        endDate,
        DEFAULT_LOCALE,
        localeStrOpts
    )
    const eventStartString = sameStartDate ? '' : `${startLocaleDateStr} `
    const eventEndString = endsAnotherDay ? `${endLocaleDateStr} ` : ''
    return `${eventStartString}${getTimeFromDate(
        startDate
    )}-${eventEndString}${getTimeFromDate(endDate)}`
}

export const Event = memo(EventComponent)
Event.displayName = 'Event'
