import { Autocomplete, Box, TextField } from '@mui/material'
import type { CalendarInfo } from '@/domain/calendar/CalendarEvent'

interface CalendarIdFieldProps {
    readonly id: string
    readonly label: string
    readonly calendars: readonly CalendarInfo[]
    readonly value: string
    readonly onChange: (id: string) => void
    readonly error?: string
}

/**
 * Lets a signed-in user pick from their real Google calendars, while still
 * accepting a freely typed calendar id (e.g. "primary") before they have
 * signed in or if their calendar is not in the list. Clearing the field
 * clears the id.
 */
export const CalendarIdField = ({
    id,
    label,
    calendars,
    value,
    onChange,
    error,
}: CalendarIdFieldProps) => {
    const selectedCalendar = calendars.find((calendar) => calendar.id === value)

    return (
        <Box>
            <Autocomplete
                id={id}
                freeSolo
                options={calendars}
                value={selectedCalendar ?? value}
                getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.name
                }
                onChange={(_, chosen) => {
                    if (chosen === null) return onChange('')
                    onChange(typeof chosen === 'string' ? chosen : chosen.id)
                }}
                onInputChange={(_, text, reason) => {
                    if (reason === 'input') onChange(text)
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        error={error !== undefined}
                        helperText={error}
                    />
                )}
            />
        </Box>
    )
}
