import Typography from '@mui/material/Typography'
import { Box, Grid, Skeleton, Stack } from '@mui/material'
import { MediumCard } from '../CardFrame'
import { CalendarEvent } from '../../models/calendar'
import { Event } from './Event'
import { xSmallFontSize } from '../../assets/styles/theme'
import React, { ReactElement, useMemo } from 'react'
import { EventTexts, TodayEventTexts, NextDaysEventTexts } from './types'
import { useGetEvents } from '../../apis/events'
import {
    getDateInXDays,
    getISODayEndString,
    getISODayStartString,
} from '../../common/dateParser'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useGetUserSettings } from '../../apis/user_settings'
import { ServerStateKeysEnum } from '../../common/statekeys'
import { useQuery } from 'react-query'

const UpcomingEvents = () => {
    const { currentDate } = useTimeContext()

    // These dates are recomputed whenever currentDate changes
    const tomorrowsDate = getDateInXDays(1)
    const overmorrowsDate = getDateInXDays(2)

    return (
        <MediumCard>
            <Grid container spacing={1} height={'100%'}>
                <Grid item xs={6}>
                    <Box>
                        <Typography variant="body1">TODAY</Typography>
                        <Stack spacing={1} direction={'column'}>
                            <EventsOnDay
                                date={currentDate}
                                maxEvents={2}
                                eventTexts={TodayEventTexts}
                                isCurrentDay={true}
                            />
                        </Stack>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Grid
                        container
                        direction="column"
                        spacing={1}
                        height={'100%'}
                    >
                        <Grid item xs={6} height={'50%'}>
                            <Typography
                                fontWeight={'bold'}
                                fontSize={xSmallFontSize}
                            >
                                TOMORROW
                            </Typography>
                            <Stack direction={'column'}>
                                <EventsOnDay
                                    date={tomorrowsDate}
                                    maxEvents={1}
                                    eventTexts={NextDaysEventTexts}
                                    isCurrentDay={false}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={6} height={'50%'}>
                            <Typography
                                fontWeight={'bold'}
                                fontSize={xSmallFontSize}
                            >
                                OVERMORROW
                            </Typography>
                            <Stack direction={'column'}>
                                <EventsOnDay
                                    date={overmorrowsDate}
                                    maxEvents={1}
                                    eventTexts={NextDaysEventTexts}
                                    isCurrentDay={false}
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </MediumCard>
    )
}

const EventsOnDay = ({
    date,
    maxEvents,
    eventTexts,
    isCurrentDay = false,
}: {
    date: Date
    maxEvents: number
    eventTexts: EventTexts
    isCurrentDay: boolean
}): ReactElement | ReactElement[] => {
    const { data: userSettings } = useGetUserSettings(false)
    const { data: minTime } = useGetMinTime(date, isCurrentDay)

    const params = useMemo(
        () =>
            new URLSearchParams({
                minTime: minTime ?? date.toISOString(),
                maxTime: getISODayEndString(date, true),
                cal_id: userSettings?.events_cal_id ?? '',
            }),
        [date, minTime, userSettings?.events_cal_id]
    )
    const { data: events, isLoading, error } = useGetEvents(params)

    if (isLoading) {
        return (
            <React.Fragment>
                {Array.from({ length: maxEvents }, (_, index) => (
                    <Skeleton key={index} variant="rounded" />
                ))}
            </React.Fragment>
        )
    } else if (error) {
        return <NoEventsItem timeFrame={'Error while loading events'} />
    } else if (events === undefined || events.count === 0) {
        return <NoEventsItem timeFrame={eventTexts.noEvents} />
    } else if (events.count <= maxEvents) {
        return events.list.map((ev) => (
            <Event item={ev} date={date} key={ev.start} />
        ))
    }

    const summary = eventTexts.manyEvents.replace(
        '{{X}}',
        `${events.count - (maxEvents - 1)}`
    )
    const summaryEventList = events.list.slice(maxEvents - 1)
    const CalendarEvent: CalendarEvent = {
        summary,
        description: '',
        start: summaryEventList[0].start,
        end: getMaxDateEndDate(summaryEventList).toISOString(),
        location: '',
        allDay: summaryEventList.some((ev) => ev.allDay),
        multiDays: summaryEventList.some((ev) => ev.multiDays),
        merged: true,
    }
    const displayEventList = events.list.slice(0, maxEvents - 1)

    return (
        <React.Fragment>
            {displayEventList.map((ev) => (
                <Event item={ev} date={date} key={ev.summary} />
            ))}
            <Event item={CalendarEvent} date={date} key={CalendarEvent.start} />
        </React.Fragment>
    )
}

const useGetMinTime = (date: Date, isCurrentDay: boolean) =>
    useQuery<string, Error>({
        queryKey: [
            ServerStateKeysEnum.min_time,
            date.toISOString(),
            isCurrentDay,
        ],
        queryFn: async () =>
            isCurrentDay
                ? new Date().toISOString()
                : getISODayStartString(date, true),
        refetchInterval: 300000, // 5 minutes
    })

const NoEventsItem = ({ timeFrame }: { timeFrame: string }): ReactElement => {
    return (
        <Typography color="text.secondary" sx={xSmallFontSize}>
            {timeFrame}
        </Typography>
    )
}

const getMaxDateEndDate = (events: Array<CalendarEvent>): Date => {
    const endDates = events.map((item) => new Date(item.end).getTime())
    return new Date(Math.max(...endDates))
}

export default UpcomingEvents
