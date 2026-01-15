import {
    Box,
    TextField,
    Button,
    Autocomplete,
} from '@mui/material'
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
import {
    TrainConnection,
    TrainDisplaySettings,
} from '../../models/user_settings'
import { TrainSettingsSection } from './TrainSettingsSection'

export interface SettingsParams {
    country: string
    city: string
    zipCode: string
    birthdayCalId: string
    eventsCalId: string
    trainConnections?: TrainConnection[]
    trainDisplaySettings?: TrainDisplaySettings
}

interface SettingsFormProps {
    calendars: CalendarListItem[]
    defaults: SettingsParams
    showBackButton: boolean
    onSend: (data: SettingsParams) => void
    onBack: () => void
}

const DEFAULT_TRAIN_DISPLAY_SETTINGS: TrainDisplaySettings = {
    mode: 'carousel',
    carouselInterval: 15,
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
        trainConnections: defaultTrainConnections,
        trainDisplaySettings: defaultTrainDisplaySettings,
    } = defaults

    const city = useRef<HTMLInputElement>(null)
    const zip = useRef<HTMLInputElement>(null)
    const [country, setCountry] = useState(defaultCountry)
    const [birthdayCalendar, setBirthdayCalendar] =
        useState<string>(birthdayCalId)
    const [eventsCalendar, setEventsCalendar] = useState<string>(eventsCalId)
    const [trainConnections, setTrainConnections] = useState<TrainConnection[]>(
        defaultTrainConnections || []
    )
    const [trainDisplaySettings, setTrainDisplaySettings] =
        useState<TrainDisplaySettings>(
            defaultTrainDisplaySettings || DEFAULT_TRAIN_DISPLAY_SETTINGS
        )

    const currentBirthdayCalendar = useMemo(
        () => calendars.find((c) => c.id === birthdayCalendar),
        [birthdayCalendar, calendars]
    )
    const currentEventsCalendar = useMemo(
        () => calendars.find((c) => c.id === eventsCalendar),
        [eventsCalendar, calendars]
    )

    const handleSend = useCallback(() => {
        if (country === '') {
            alert('Country must not be empty!')
            return
        }
        if (!birthdayCalendar) {
            alert('Birthday Calendar must not be empty!')
            return
        }
        if (!eventsCalendar) {
            alert('Events Calendar must not be empty!')
            return
        }

        validate(country, city.current?.value, zip.current?.value)
            .then(() => {
                const validConnections = trainConnections.filter(
                    (conn) => conn.departureStationId && conn.arrivalStationId
                )
                onSend({
                    country,
                    city: city.current!.value,
                    zipCode: zip.current!.value,
                    birthdayCalId: birthdayCalendar,
                    eventsCalId: eventsCalendar,
                    trainConnections: validConnections,
                    trainDisplaySettings,
                })
            })
            .catch(() => alert('Address could not be geolocated!'))
    }, [
        country,
        birthdayCalendar,
        eventsCalendar,
        onSend,
        trainConnections,
        trainDisplaySettings,
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

            <CalendarAutocomplete
                id="events-cal"
                label="Events Calendar"
                calendars={calendars}
                value={currentEventsCalendar ?? null}
                onChange={setEventsCalendar}
            />

            <CalendarAutocomplete
                id="bday-cal"
                label="Birthday Calendar"
                calendars={calendars}
                value={currentBirthdayCalendar ?? null}
                onChange={setBirthdayCalendar}
            />

            <TrainSettingsSection
                connections={trainConnections}
                displaySettings={trainDisplaySettings}
                onConnectionsChange={setTrainConnections}
                onDisplaySettingsChange={setTrainDisplaySettings}
            />

            <Box sx={buttonBoxStyle}>
                <Button variant="outlined" onClick={handleSend}>
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

interface CalendarAutocompleteProps {
    id: string
    label: string
    calendars: CalendarListItem[]
    value: CalendarListItem | null
    onChange: (id: string) => void
}

const CalendarAutocomplete = ({
    id,
    label,
    calendars,
    value,
    onChange,
}: CalendarAutocompleteProps) => (
    <Box>
        <Autocomplete
            id={id}
            options={calendars}
            value={value}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => newValue && onChange(newValue.id)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            autoComplete: 'new-password',
                        },
                        htmlInput: {
                            ...params.inputProps,
                            autoComplete: 'new-password',
                        },
                    }}
                />
            )}
        />
    </Box>
)

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
