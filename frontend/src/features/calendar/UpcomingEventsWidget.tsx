import { memo, useMemo, type ReactNode } from 'react'
import { Box, Grid, Skeleton, Stack, Typography } from '@mui/material'
import type { CalendarEvent } from '@/domain/calendar/CalendarEvent'
import {
    eventsOnDay,
    splitOverflow,
    summarizeOverflow,
} from '@/domain/calendar/eventRules'
import { addDays, type PlainDate, type TimeZoneId } from '@/domain/shared/time'
import { useSetting } from '@/features/settings'
import { useLocale, useNow, useTimeZone, useToday } from '@/features/time'
import { xSmallFontSize } from '@/shared/styles/theme'
import { MediumCard } from '@/shared/ui/CardFrame'
import { describeEventTime } from './eventFormatting'
import { EventItem } from './EventItem'
import { useUpcomingEvents } from './hooks/useUpcomingEvents'
import { useCalendarAccess } from './useCalendarAccess'
import { RENEW_MESSAGE, widgetView } from './widgetView'

interface DayPlan {
    readonly title: string
    /** How many lines the day has room for, a summary line included. */
    readonly maxLines: number
    readonly emptyText: string
    readonly overflowText: (hiddenCount: number) => string
}

const TODAY: DayPlan = {
    title: 'TODAY',
    maxLines: 2,
    emptyText: 'No more events today',
    overflowText: (n) => `${n} more events`,
}
const TOMORROW: DayPlan = {
    title: 'TOMORROW',
    maxLines: 1,
    emptyText: 'No events',
    overflowText: (n) => `${n} events`,
}
const OVERMORROW: DayPlan = { ...TOMORROW, title: 'OVERMORROW' }

interface DayContext {
    readonly day: PlainDate
    readonly timeZone: TimeZoneId
    readonly locale: string
}

const Notice = ({ children }: { children: ReactNode }) => (
    <Typography color="text.secondary" sx={xSmallFontSize}>
        {children}
    </Typography>
)

const DayEvents = ({
    plan,
    events,
    context,
}: {
    plan: DayPlan
    events: readonly CalendarEvent[]
    context: DayContext
}) => {
    const { day, timeZone, locale } = context
    if (events.length === 0) return <Notice>{plan.emptyText}</Notice>

    const { visible, hidden } = splitOverflow(events, plan.maxLines)
    return (
        <>
            {visible.map((event, index) => (
                <EventItem
                    key={`${event.span.start}-${event.title}-${index}`}
                    title={event.title}
                    time={describeEventTime(event.span, day, timeZone, locale)}
                    location={event.location}
                />
            ))}
            {hidden.length > 0 && (
                <EventItem
                    title={plan.overflowText(hidden.length)}
                    time={describeEventTime(
                        summarizeOverflow(hidden, timeZone).span,
                        day,
                        timeZone,
                        locale,
                        { showProgress: false }
                    )}
                    location=""
                />
            )}
        </>
    )
}

const DayPlaceholder = ({ lines }: { lines: number }) => (
    <>
        {Array.from({ length: lines }, (_, index) => (
            <Skeleton key={index} variant="rounded" />
        ))}
    </>
)

const Day = ({
    plan,
    primary = false,
    children,
}: {
    plan: DayPlan
    primary?: boolean
    children: ReactNode
}) => (
    <Box sx={primary ? undefined : { height: '50%' }}>
        {primary ? (
            <Typography variant="body1">{plan.title}</Typography>
        ) : (
            <Typography sx={{ fontWeight: 'bold', ...xSmallFontSize }}>
                {plan.title}
            </Typography>
        )}
        <Stack spacing={primary ? 1 : 0} direction="column">
            {children}
        </Stack>
    </Box>
)

interface BoardProps {
    readonly render: (plan: DayPlan, offset: number) => ReactNode
}

// Today on the left; tomorrow and the day after stacked on the right.
const Board = ({ render }: BoardProps) => (
    <Grid container spacing={1} sx={{ height: '100%' }}>
        <Grid size={6}>
            <Day plan={TODAY} primary>
                {render(TODAY, 0)}
            </Day>
        </Grid>
        <Grid size={6}>
            <Stack spacing={1} sx={{ height: '100%' }}>
                <Day plan={TOMORROW}>{render(TOMORROW, 1)}</Day>
                <Day plan={OVERMORROW}>{render(OVERMORROW, 2)}</Day>
            </Stack>
        </Grid>
    </Grid>
)

const UpcomingEventsComponent = () => {
    const calendarId = useSetting((settings) => settings.eventsCalendarId)
    const { events, isError } = useUpcomingEvents(calendarId)
    const access = useCalendarAccess()
    const today = useToday()
    const now = useNow()
    const timeZone = useTimeZone()
    const locale = useLocale()

    const view = widgetView({
        access,
        hasData: events !== undefined,
        isError,
    })

    const perDay = useMemo(
        () =>
            [0, 1, 2].map((offset) => {
                const day = addDays(today, offset)
                // Only today needs "what is left": the others start later.
                return {
                    day,
                    events: eventsOnDay(events ?? [], day, timeZone, now),
                }
            }),
        [events, today, now, timeZone]
    )

    let content: ReactNode
    if (view === 'sign-in') {
        content = <Notice>Sign in with Google in Settings</Notice>
    } else if (view === 'renew') {
        content = <Notice>{RENEW_MESSAGE}</Notice>
    } else if (view === 'error') {
        content = <Notice>Error while loading events</Notice>
    } else if (view === 'loading') {
        content = (
            <Board
                render={(plan) => <DayPlaceholder lines={plan.maxLines} />}
            />
        )
    } else {
        content = (
            <Board
                render={(plan, offset) => (
                    <DayEvents
                        plan={plan}
                        events={perDay[offset].events}
                        context={{
                            day: perDay[offset].day,
                            timeZone,
                            locale,
                        }}
                    />
                )}
            />
        )
    }

    return <MediumCard>{content}</MediumCard>
}

export const UpcomingEventsWidget = memo(UpcomingEventsComponent)
UpcomingEventsWidget.displayName = 'UpcomingEventsWidget'
