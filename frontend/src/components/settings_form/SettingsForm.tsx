import { Box, TextField, Button, Autocomplete } from '@mui/material'
import CountrySelect from '../country_select/CountrySelect'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
    buttonBoxStyle,
    countryBoxStyle,
    inputBoxStyle,
    parentBoxStyle,
} from './style'
import { LOCATION_API, TRAINS_API } from '../../constants/api'
import { CalendarListItem } from '../../models/calendar'
import { TrainStation } from '../../models/trains'

export interface SettingsParams {
    country: string
    city: string
    zipCode: string
    birthdayCalId: string
    eventsCalId: string
    trainDepartureStationId?: string
    trainDepartureStationName?: string
    trainArrivalStationId?: string
    trainArrivalStationName?: string
}

interface SettingsFormProps {
    calendars: CalendarListItem[]
    defaults: SettingsParams
    showBackButton: boolean
    onSend: (data: SettingsParams) => void
    onBack: () => void
}

export const SettingsForm = ({
    calendars,
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
        trainDepartureStationId,
        trainDepartureStationName,
        trainArrivalStationId,
        trainArrivalStationName,
    } = defaults
    const city = useRef<HTMLInputElement>(null)
    const zip = useRef<HTMLInputElement>(null)
    const [country, setCountry] = useState(defaultCountry)
    const [birthdayCalendar, setBirthdayCalendar] =
        useState<string>(birthdayCalId)
    const [eventsCalender, setEventsCalender] = useState<string>(eventsCalId)
    const [departureStation, setDepartureStation] = useState<TrainStation | null>(
        trainDepartureStationId && trainDepartureStationName
            ? { id: trainDepartureStationId, name: trainDepartureStationName }
            : null
    )
    const [arrivalStation, setArrivalStation] = useState<TrainStation | null>(
        trainArrivalStationId && trainArrivalStationName
            ? { id: trainArrivalStationId, name: trainArrivalStationName }
            : null
    )
    const [departureQuery, setDepartureQuery] = useState('')
    const [arrivalQuery, setArrivalQuery] = useState('')
    const [departureStations, setDepartureStations] = useState<TrainStation[]>([])
    const [arrivalStations, setArrivalStations] = useState<TrainStation[]>([])
    const currentBirthdayCalendar = useMemo(
        () => calendars.find((c) => c.id === birthdayCalendar),
        [birthdayCalendar, calendars]
    )
    const currentEventsCalendar = useMemo(
        () => calendars.find((c) => c.id === eventsCalender),
        [eventsCalender, calendars]
    )

    const searchDepartureStations = useCallback(
        async (query: string) => {
            if (query.length >= 2) {
                try {
                    const response = await fetch(
                        `${TRAINS_API}/stations?query=${encodeURIComponent(query)}&results=10`
                    )
                    if (response.ok) {
                        const stations = await response.json()
                        setDepartureStations(stations)
                    }
                } catch (error) {
                    console.error('Error searching departure stations:', error)
                }
            }
        },
        []
    )

    const searchArrivalStations = useCallback(
        async (query: string) => {
            if (query.length >= 2) {
                try {
                    const response = await fetch(
                        `${TRAINS_API}/stations?query=${encodeURIComponent(query)}&results=10`
                    )
                    if (response.ok) {
                        const stations = await response.json()
                        setArrivalStations(stations)
                    }
                } catch (error) {
                    console.error('Error searching arrival stations:', error)
                }
            }
        },
        []
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
                        trainDepartureStationId: departureStation?.id,
                        trainDepartureStationName: departureStation?.name,
                        trainArrivalStationId: arrivalStation?.id,
                        trainArrivalStationName: arrivalStation?.name,
                    }
                    onSend(data)
                })
                .catch(() => alert('Address could not be geolocated!'))
        }
    }, [
        country,
        birthdayCalendar,
        eventsCalender,
        onSend,
        birthdayCalId,
        eventsCalId,
        departureStation,
        arrivalStation,
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
                    id="departure-station"
                    options={departureStations}
                    value={departureStation}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, value) => setDepartureStation(value)}
                    onInputChange={(_, value) => {
                        setDepartureQuery(value)
                        searchDepartureStations(value)
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Departure Station (optional)"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password',
                            }}
                        />
                    )}
                />
            </Box>
            <Box>
                <Autocomplete
                    id="arrival-station"
                    options={arrivalStations}
                    value={arrivalStation}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, value) => setArrivalStation(value)}
                    onInputChange={(_, value) => {
                        setArrivalQuery(value)
                        searchArrivalStations(value)
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Arrival Station (optional)"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password',
                            }}
                        />
                    )}
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
