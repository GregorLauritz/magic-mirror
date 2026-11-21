import { Box } from '@mui/material'
import { useCalendarList } from '@/features/calendar'
import { CalendarIdField } from './CalendarIdField'
import { inputBoxStyle } from './styles'

interface CalendarSectionProps {
    readonly eventsCalendarId: string
    readonly birthdayCalendarId: string
    readonly errors: {
        readonly eventsCalendarId?: string
        readonly birthdayCalendarId?: string
    }
    readonly onEventsCalendarChange: (id: string) => void
    readonly onBirthdayCalendarChange: (id: string) => void
}

/** Which calendars feed the events and birthdays widgets. */
export const CalendarSection = ({
    eventsCalendarId,
    birthdayCalendarId,
    errors,
    onEventsCalendarChange,
    onBirthdayCalendarChange,
}: CalendarSectionProps) => {
    const { calendars } = useCalendarList()

    return (
        <Box sx={inputBoxStyle}>
            <CalendarIdField
                id="events-cal"
                label="Events Calendar ID"
                calendars={calendars}
                value={eventsCalendarId}
                onChange={onEventsCalendarChange}
                error={errors.eventsCalendarId}
            />
            <CalendarIdField
                id="bday-cal"
                label="Birthday Calendar ID"
                calendars={calendars}
                value={birthdayCalendarId}
                onChange={onBirthdayCalendarChange}
                error={errors.birthdayCalendarId}
            />
        </Box>
    )
}
