import { Box, TextField, Button, Autocomplete } from '@mui/material'
import CountrySelect from '../country_select/CountrySelect'
import { useMemo, useRef, useState } from 'react'
import {
    buttonBoxStyle,
    countryBoxStyle,
    inputBoxStyle,
    parentBoxStyle,
} from './style'
import { LOCATION_API } from '../../constants/api'
import { CalendarListItem } from '../../models/calendar'

type SettingsParams = {
    country: string
    city: string
    zipCode: string
    birthdayCalId: string
    eventsCalId: string
}

type Props = {
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
}: Props) => {
    const {
        country: defaultCountry,
        city: defaultCity,
        zipCode: defaultZipCode,
        birthdayCalId,
        eventsCalId,
    } = defaults
    const defaultBirthdayCalendar = useMemo(
        () => calendars.find((c) => c.id === birthdayCalId),
        [birthdayCalId, calendars]
    )
    const defaultEventsCalendar = useMemo(
        () => calendars.find((c) => c.id === eventsCalId),
        [eventsCalId, calendars]
    )
    const city = useRef<HTMLInputElement>()
    const zip = useRef<HTMLInputElement>()
    const [country, setCountry] = useState(defaultCountry)
    const [birthdayCalendar, setBirthdayCalendar] = useState<string>()
    const [eventsCalender, setEventsCalender] = useState<string>()

    const onSendButton = () => {
        if (country === '') {
            alert('Country must not be empty!')
        } else {
            validate(country, city.current?.value, zip.current?.value)
                .then(handleValidInput)
                .catch(() => alert('Address could not be geolocated!'))
        }
    }

    const handleValidInput = async () => {
        if (onSend) {
            const data = {
                country,
                city: city.current!.value,
                zipCode: zip.current!.value,
                birthdayCalId: birthdayCalendar ?? birthdayCalId,
                eventsCalId: eventsCalender ?? eventsCalId,
            }
            onSend(data)
        }
    }

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
                    value={defaultEventsCalendar}
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
                    value={defaultBirthdayCalendar}
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

const validate = async (country: string, city?: string, zipCode?: string) => {
    const params = new URLSearchParams({
        country,
        city: city ?? '',
        zip_code: zipCode ?? '',
    })
    return fetch(`${LOCATION_API}/geocode?${params.toString()}`)
        .then((res) => {
            if (res.ok) return
            throw Error()
        })
        .catch((err) => {
            throw err
        })
}

export type { SettingsParams }
