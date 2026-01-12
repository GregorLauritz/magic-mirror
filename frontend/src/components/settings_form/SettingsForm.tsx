import { Box, TextField, Button, Autocomplete, FormControlLabel, Checkbox } from '@mui/material'
import CountrySelect from '../country_select/CountrySelect'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
    buttonBoxStyle,
    countryBoxStyle,
    inputBoxStyle,
    parentBoxStyle,
} from './style'
import { LOCATION_API } from '../../constants/api'
import { CalendarListItem } from '../../models/calendar'
import { TaskListItem } from '../../models/tasks'

export interface SettingsParams {
    country: string
    city: string
    zipCode: string
    birthdayCalId: string
    eventsCalId: string
    taskListIds: string[]
    showCompletedTasks: boolean
}

interface SettingsFormProps {
    calendars: CalendarListItem[]
    taskLists: TaskListItem[]
    defaults: SettingsParams
    showBackButton: boolean
    onSend: (data: SettingsParams) => void
    onBack: () => void
}

export const SettingsForm = ({
    calendars,
    taskLists,
    defaults,
    showBackButton,
    onSend,
    onBack,
}: SettingsFormProps) => {
    const {
        country: defaultCountry,
        city: defaultCity,
        zipCode: defaultZipCode,
        birthdayCalId,
        eventsCalId,
        taskListIds,
        showCompletedTasks,
    } = defaults
    const city = useRef<HTMLInputElement>(null)
    const zip = useRef<HTMLInputElement>(null)
    const [country, setCountry] = useState(defaultCountry)
    const [birthdayCalendar, setBirthdayCalendar] =
        useState<string>(birthdayCalId)
    const [eventsCalender, setEventsCalender] = useState<string>(eventsCalId)
    const [selectedTaskLists, setSelectedTaskLists] = useState<string[]>(
        taskListIds
    )
    const [showCompleted, setShowCompleted] = useState<boolean>(
        showCompletedTasks
    )
    const currentBirthdayCalendar = useMemo(
        () => calendars.find((c) => c.id === birthdayCalendar),
        [birthdayCalendar, calendars]
    )
    const currentEventsCalendar = useMemo(
        () => calendars.find((c) => c.id === eventsCalender),
        [eventsCalender, calendars]
    )
    const currentTaskLists = useMemo(
        () => taskLists.filter((t) => selectedTaskLists.includes(t.id)),
        [selectedTaskLists, taskLists]
    )

    const onSendButton = useCallback(() => {
        if (country === '') {
            alert('Country must not be empty!')
        } else if (birthdayCalendar === '' || birthdayCalendar === undefined) {
            alert('Birthday Calendar must not be empty!')
        } else if (eventsCalender === '' || eventsCalender === undefined) {
            alert('Events Calendar must not be empty!')
        } else if (onSend) {
            validate(country, city.current?.value, zip.current?.value)
                .then(() => {
                    const data = {
                        country,
                        city: city.current!.value,
                        zipCode: zip.current!.value,
                        birthdayCalId: birthdayCalendar ?? birthdayCalId,
                        eventsCalId: eventsCalender ?? eventsCalId,
                        taskListIds: selectedTaskLists,
                        showCompletedTasks: showCompleted,
                    }
                    onSend(data)
                })
                .catch(() => alert('Address could not be geolocated!'))
        }
    }, [
        country,
        birthdayCalendar,
        eventsCalender,
        selectedTaskLists,
        showCompleted,
        onSend,
        birthdayCalId,
        eventsCalId,
    ])

    return (
        <Box sx={parentBoxStyle}>
            <Box sx={countryBoxStyle}>
                <CountrySelect
                    inputCallback={setCountry}
                    defaultCountryCode={defaultCountry}
                />
            </Box>
            <Box
                component="form"
                sx={inputBoxStyle}
                noValidate
                autoComplete="off"
            >
                <TextField
                    id="city"
                    label="City"
                    variant="outlined"
                    inputRef={city}
                    defaultValue={defaultCity}
                />
                <TextField
                    id="zip"
                    label="Zip Code"
                    variant="outlined"
                    inputRef={zip}
                    defaultValue={defaultZipCode}
                />
            </Box>
            <Box>
                <Autocomplete
                    id="events-cal"
                    options={calendars}
                    value={currentEventsCalendar}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) =>
                        value && setEventsCalender(value.id)
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Events Calendar"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password', // disable autocomplete and autofill
                            }}
                        />
                    )}
                />
            </Box>
            <Box>
                <Autocomplete
                    id="bday-cal"
                    options={calendars}
                    value={currentBirthdayCalendar}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) =>
                        value && setBirthdayCalendar(value.id)
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Birthday Calendar"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password', // disable autocomplete and autofill
                            }}
                        />
                    )}
                />
            </Box>
            <Box>
                <Autocomplete
                    multiple
                    id="task-lists"
                    options={taskLists}
                    value={currentTaskLists}
                    getOptionLabel={(option) => option.title}
                    onChange={(_, value) =>
                        setSelectedTaskLists(value.map((v) => v.id))
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Task Lists (all if empty)"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password',
                            }}
                        />
                    )}
                />
            </Box>
            <Box>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                        />
                    }
                    label="Show Completed Tasks"
                />
            </Box>
            <Box sx={buttonBoxStyle}>
                <Button variant="outlined" onClick={onSendButton}>
                    Send
                </Button>
                {showBackButton && (
                    <Button variant="outlined" onClick={onBack}>
                        Back
                    </Button>
                )}
            </Box>
        </Box>
    )
}

const validate = async (
    country: string,
    city?: string,
    zipCode?: string
): Promise<void> => {
    const params = new URLSearchParams({
        country,
        city: city ?? '',
        zip_code: zipCode ?? '',
    })
    const response = await fetch(`${LOCATION_API}/geocode?${params.toString()}`)
    if (!response.ok) {
        throw new Error('Geocoding validation failed')
    }
}
