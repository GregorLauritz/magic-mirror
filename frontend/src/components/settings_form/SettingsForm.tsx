import {
    Box,
    TextField,
    Button,
    Autocomplete,
    Typography,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Divider,
} from '@mui/material'
import CountrySelect from '../country_select/CountrySelect'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    buttonBoxStyle,
    countryBoxStyle,
    inputBoxStyle,
    parentBoxStyle,
} from './style'
import { LOCATION_API, TRAINS_API } from '../../constants/api'
import { CalendarListItem } from '../../models/calendar'
import { TrainStation } from '../../models/trains'
import {
    TrainConnection,
    TrainDisplaySettings,
} from '../../models/user_settings'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

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
    const [eventsCalender, setEventsCalender] = useState<string>(eventsCalId)

    // Train connections state
    const [trainConnections, setTrainConnections] = useState<TrainConnection[]>(
        defaultTrainConnections || []
    )
    const [trainDisplaySettings, setTrainDisplaySettings] =
        useState<TrainDisplaySettings>(
            defaultTrainDisplaySettings || {
                mode: 'carousel',
                carouselInterval: 15,
            }
        )

    const currentBirthdayCalendar = useMemo(
        () => calendars.find((c) => c.id === birthdayCalendar),
        [birthdayCalendar, calendars]
    )
    const currentEventsCalendar = useMemo(
        () => calendars.find((c) => c.id === eventsCalender),
        [eventsCalender, calendars]
    )

    const addTrainConnection = () => {
        if (trainConnections.length < 5) {
            setTrainConnections([
                ...trainConnections,
                {
                    id: `${Date.now()}`,
                    departureStationId: '',
                    departureStationName: '',
                    arrivalStationId: '',
                    arrivalStationName: '',
                },
            ])
        }
    }

    const removeTrainConnection = (id: string) => {
        setTrainConnections(
            trainConnections.filter((connection) => connection.id !== id)
        )
    }

    const updateTrainConnection = (
        id: string,
        field: keyof TrainConnection,
        value: string
    ) => {
        setTrainConnections(
            trainConnections.map((connection) =>
                connection.id === id
                    ? { ...connection, [field]: value }
                    : connection
            )
        )
    }

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
                        trainConnections: trainConnections.filter(
                            (conn) =>
                                conn.departureStationId &&
                                conn.arrivalStationId
                        ),
                        trainDisplaySettings,
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
            <Box>
                <Autocomplete
                    id="events-cal"
                    options={calendars}
                    value={currentEventsCalendar ?? null}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) =>
                        value && setEventsCalender(value.id)
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Events Calendar"
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
            <Box>
                <Autocomplete
                    id="bday-cal"
                    options={calendars}
                    value={currentBirthdayCalendar ?? null}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) =>
                        value && setBirthdayCalendar(value.id)
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Birthday Calendar"
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

            {/* Train Connections Section */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
                Train Connections (optional)
            </Typography>

            {/* Train Display Settings */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 2,
                }}
            >
                <FormControl fullWidth>
                    <InputLabel>Display Mode</InputLabel>
                    <Select
                        value={trainDisplaySettings.mode}
                        label="Display Mode"
                        onChange={(e) =>
                            setTrainDisplaySettings({
                                ...trainDisplaySettings,
                                mode: e.target.value as 'carousel' | 'multiple',
                            })
                        }
                    >
                        <MenuItem value="carousel">
                            Carousel (rotate through connections)
                        </MenuItem>
                        <MenuItem value="multiple">
                            Multiple Cards (one per connection)
                        </MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Carousel Interval (seconds)"
                    type="number"
                    value={trainDisplaySettings.carouselInterval}
                    onChange={(e) =>
                        setTrainDisplaySettings({
                            ...trainDisplaySettings,
                            carouselInterval: Math.max(
                                5,
                                parseInt(e.target.value) || 15
                            ),
                        })
                    }
                    disabled={trainDisplaySettings.mode !== 'carousel'}
                    fullWidth
                />
            </Box>

            {/* Train Connections List */}
            {trainConnections.map((connection) => (
                <TrainConnectionEditor
                    key={connection.id}
                    connection={connection}
                    onUpdate={updateTrainConnection}
                    onRemove={removeTrainConnection}
                />
            ))}

            {/* Add Connection Button */}
            {trainConnections.length < 5 && (
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addTrainConnection}
                    sx={{ mb: 2 }}
                >
                    Add Train Connection ({trainConnections.length}/5)
                </Button>
            )}

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

interface TrainConnectionEditorProps {
    connection: TrainConnection
    onUpdate: (
        id: string,
        field: keyof TrainConnection,
        value: string
    ) => void
    onRemove: (id: string) => void
}

const TrainConnectionEditor = ({
    connection,
    onUpdate,
    onRemove,
}: TrainConnectionEditorProps) => {
    const [departureQuery, setDepartureQuery] = useState('')
    const [arrivalQuery, setArrivalQuery] = useState('')
    const [departureStations, setDepartureStations] = useState<TrainStation[]>(
        []
    )
    const [arrivalStations, setArrivalStations] = useState<TrainStation[]>([])

    const departureStation = useMemo(
        () =>
            connection.departureStationId
                ? {
                      id: connection.departureStationId,
                      name: connection.departureStationName,
                  }
                : null,
        [connection.departureStationId, connection.departureStationName]
    )

    const arrivalStation = useMemo(
        () =>
            connection.arrivalStationId
                ? {
                      id: connection.arrivalStationId,
                      name: connection.arrivalStationName,
                  }
                : null,
        [connection.arrivalStationId, connection.arrivalStationName]
    )

    const searchStations = useCallback(
        async (
            query: string,
            setStations: React.Dispatch<React.SetStateAction<TrainStation[]>>
        ) => {
            if (query.length >= 2) {
                try {
                    const response = await fetch(
                        `${TRAINS_API}/stations?query=${encodeURIComponent(query)}&results=10`
                    )
                    if (response.ok) {
                        const stations = await response.json()
                        setStations(stations)
                    }
                } catch (error) {
                    console.error('Error searching stations:', error)
                }
            }
        },
        []
    )

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchStations(departureQuery, setDepartureStations)
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [departureQuery, searchStations])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchStations(arrivalQuery, setArrivalStations)
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [arrivalQuery, searchStations])

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 2,
                position: 'relative',
            }}
        >
            <IconButton
                size="small"
                onClick={() => onRemove(connection.id)}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                }}
            >
                <DeleteIcon />
            </IconButton>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete
                    options={departureStations}
                    value={departureStation}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    onChange={(_, value) => {
                        onUpdate(
                            connection.id,
                            'departureStationId',
                            value?.id || ''
                        )
                        onUpdate(
                            connection.id,
                            'departureStationName',
                            value?.name || ''
                        )
                    }}
                    onInputChange={(_, value) => setDepartureQuery(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Departure Station"
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

                <Autocomplete
                    options={arrivalStations}
                    value={arrivalStation}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    onChange={(_, value) => {
                        onUpdate(
                            connection.id,
                            'arrivalStationId',
                            value?.id || ''
                        )
                        onUpdate(
                            connection.id,
                            'arrivalStationName',
                            value?.name || ''
                        )
                    }}
                    onInputChange={(_, value) => setArrivalQuery(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Arrival Station"
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
        </Paper>
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
