import Typography from '@mui/material/Typography'
import React from 'react'
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

interface ICalendarEvent {
    item: CalendarEvent
    date: Date
}

export const Event = ({ item, date }: ICalendarEvent) => {
    const localeStrOpts: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
    }
    const eventTime = getEventTime({ item, date }, localeStrOpts)
    const details = (
        <React.Fragment>
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
        </React.Fragment>
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
                {details}
            </Stack>
        </Paper>
    )
}

const getEventTime = (
    { item, date }: ICalendarEvent,
    localeStrOpts: Intl.DateTimeFormatOptions
) => {
    if (item.allDay && !item.multiDays) {
        return 'All day'
    } else if (item.allDay && item.multiDays) {
        return handleMultiFullDayEvent({ item, date }, localeStrOpts)
    } else {
        return handleNormalEvent({ item, date }, localeStrOpts)
    }
}

const handleMultiFullDayEvent = (
    { item, date }: ICalendarEvent,
    localeStrOpts: Intl.DateTimeFormatOptions
) => {
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
    { item, date }: ICalendarEvent,
    localeStrOpts: Intl.DateTimeFormatOptions
) => {
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
