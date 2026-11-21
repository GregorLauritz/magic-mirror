import { Box, TextField, Button, Link, Autocomplete } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CountrySelect from '../country_select/CountrySelect'
import { useCallback, useRef, useState } from 'react'
import {
    apiKeysHeaderStyle,
    buttonBoxStyle,
    countryBoxStyle,
    inputBoxStyle,
    parentBoxStyle,
} from './style'
import {
    TrainConnection,
    TrainDisplaySettings,
} from '../../models/user_settings'
import { CalendarListItem } from '../../models/calendar'
import { TrainSettingsSection } from './TrainSettingsSection'
import { getGeocode } from '../../services/geocode'
import { readApiKeys, useApiKeys } from '../../hooks/useApiKeys'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { useListCalendars } from '../../apis/calendar_list'
import { runtimeConfig } from '../../constants/runtimeConfig'

const API_KEYS_DOCS_URL = runtimeConfig.docsUrl

const DEFAULT_CALENDAR_ID = 'primary'

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
    defaults: SettingsParams
    showBackButton: boolean
    onSend: (data: SettingsParams) => void
    onBack: () => void
}

const DEFAULT_TRAIN_DISPLAY_SETTINGS: TrainDisplaySettings = {
    mode: 'carousel',
    carousel_interval: 15,
}

export const SettingsForm = ({
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
    const [birthdayCalendar, setBirthdayCalendar] = useState<string>(
        birthdayCalId || DEFAULT_CALENDAR_ID
    )
    const [eventsCalendar, setEventsCalendar] = useState<string>(
        eventsCalId || DEFAULT_CALENDAR_ID
    )
    const [trainConnections, setTrainConnections] = useState<TrainConnection[]>(
        defaultTrainConnections || []
    )
    const [trainDisplaySettings, setTrainDisplaySettings] =
        useState<TrainDisplaySettings>(
            defaultTrainDisplaySettings || DEFAULT_TRAIN_DISPLAY_SETTINGS
        )

    const { setApiKeys } = useApiKeys()
    const [geocodeApiKey, setGeocodeApiKey] = useState(
        () => readApiKeys().geocodeApiKey
    )
    const [openWeatherMapApiKey, setOpenWeatherMapApiKey] = useState(
        () => readApiKeys().openWeatherMapApiKey
    )

    const {
        isSignedIn,
        isSigningIn,
        error: googleAuthError,
        signIn,
        signOut,
    } = useGoogleAuth()
    const { data: calendars } = useListCalendars()

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
        if (!geocodeApiKey) {
            alert('Geocode Maps API Key must not be empty!')
            return
        }

        validate(
            country,
            geocodeApiKey,
            city.current?.value,
            zip.current?.value
        )
            .then(() => {
                setApiKeys({ geocodeApiKey, openWeatherMapApiKey })

                const validConnections = trainConnections.filter(
                    (conn) =>
                        conn.departure_station_id && conn.arrival_station_id
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
        geocodeApiKey,
        openWeatherMapApiKey,
        setApiKeys,
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

            <Box sx={apiKeysHeaderStyle}>
                Google Account
                {isSignedIn ? (
                    <Button size="small" onClick={signOut}>
                        Sign out
                    </Button>
                ) : (
                    <Button
                        size="small"
                        disabled={isSigningIn}
                        onClick={signIn}
                    >
                        {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
                    </Button>
                )}
            </Box>
            {googleAuthError && (
                <Box sx={{ textAlign: 'center', color: 'error.main' }}>
                    {googleAuthError}
                </Box>
            )}

            <Box sx={inputBoxStyle}>
                <CalendarIdField
                    id="events-cal"
                    label="Events Calendar ID"
                    calendars={calendars ?? []}
                    value={eventsCalendar}
                    onChange={setEventsCalendar}
                />
                <CalendarIdField
                    id="bday-cal"
                    label="Birthday Calendar ID"
                    calendars={calendars ?? []}
                    value={birthdayCalendar}
                    onChange={setBirthdayCalendar}
                />
            </Box>

            <Box>
                <Box sx={apiKeysHeaderStyle}>
                    API Keys
                    <Link
                        href={API_KEYS_DOCS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="How to get these API keys"
                    >
                        <OpenInNewIcon fontSize="small" />
                    </Link>
                </Box>
                <Box sx={inputBoxStyle}>
                    <TextField
                        id="geocode-api-key"
                        label="Geocode Maps API Key"
                        variant="outlined"
                        value={geocodeApiKey}
                        onChange={(e) => setGeocodeApiKey(e.target.value)}
                    />
                    <TextField
                        id="openweathermap-api-key"
                        label="OpenWeatherMap API Key (optional)"
                        variant="outlined"
                        value={openWeatherMapApiKey}
                        onChange={(e) =>
                            setOpenWeatherMapApiKey(e.target.value)
                        }
                    />
                </Box>
            </Box>

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

const validate = async (
    country: string,
    geocodeApiKey: string,
    city?: string,
    zipCode?: string
): Promise<void> => {
    await getGeocode(country, geocodeApiKey, city, zipCode)
}

interface CalendarIdFieldProps {
    id: string
    label: string
    calendars: CalendarListItem[]
    value: string
    onChange: (id: string) => void
}

// Lets a signed-in user pick from their real Google calendars, while still
// accepting a freely-typed calendar ID (e.g. "primary") before they've
// signed in or if their calendar isn't in the list yet.
const CalendarIdField = ({
    id,
    label,
    calendars,
    value,
    onChange,
}: CalendarIdFieldProps) => {
    const selectedCalendar = calendars.find((c) => c.id === value)

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
                onChange={(_, newValue) => {
                    if (!newValue) return
                    onChange(
                        typeof newValue === 'string' ? newValue : newValue.id
                    )
                }}
                onInputChange={(_, newInputValue, reason) => {
                    if (reason === 'input') onChange(newInputValue)
                }}
                renderInput={(params) => (
                    <TextField {...params} label={label} />
                )}
            />
        </Box>
    )
}
