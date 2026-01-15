import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import {
    TrainConnection,
    TrainDisplaySettings,
} from '../../models/user_settings'
import { TrainConnectionEditor } from './TrainConnectionEditor'

const MAX_CONNECTIONS = 5
const MIN_CAROUSEL_INTERVAL = 5
const DEFAULT_CAROUSEL_INTERVAL = 15

interface TrainSettingsSectionProps {
    connections: TrainConnection[]
    displaySettings: TrainDisplaySettings
    onConnectionsChange: (connections: TrainConnection[]) => void
    onDisplaySettingsChange: (settings: TrainDisplaySettings) => void
}

export const TrainSettingsSection = ({
    connections,
    displaySettings,
    onConnectionsChange,
    onDisplaySettingsChange,
}: TrainSettingsSectionProps) => {
    const addConnection = () => {
        if (connections.length < MAX_CONNECTIONS) {
            onConnectionsChange([
                ...connections,
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

    const removeConnection = (id: string) => {
        onConnectionsChange(connections.filter((c) => c.id !== id))
    }

    const updateConnection = (updated: TrainConnection) => {
        onConnectionsChange(
            connections.map((c) => (c.id === updated.id ? updated : c))
        )
    }

    const handleModeChange = (mode: 'carousel' | 'multiple') => {
        onDisplaySettingsChange({ ...displaySettings, mode })
    }

    const handleIntervalChange = (value: string) => {
        const interval = Math.max(
            MIN_CAROUSEL_INTERVAL,
            parseInt(value) || DEFAULT_CAROUSEL_INTERVAL
        )
        onDisplaySettingsChange({ ...displaySettings, carouselInterval: interval })
    }

    return (
        <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
                Train Connections (optional)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Display Mode</InputLabel>
                    <Select
                        value={displaySettings.mode}
                        label="Display Mode"
                        onChange={(e) =>
                            handleModeChange(
                                e.target.value as 'carousel' | 'multiple'
                            )
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
                    value={displaySettings.carouselInterval}
                    onChange={(e) => handleIntervalChange(e.target.value)}
                    disabled={displaySettings.mode !== 'carousel'}
                    fullWidth
                />
            </Box>

            {connections.map((connection) => (
                <TrainConnectionEditor
                    key={connection.id}
                    connection={connection}
                    onUpdate={updateConnection}
                    onRemove={removeConnection}
                />
            ))}

            {connections.length < MAX_CONNECTIONS && (
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addConnection}
                    sx={{ mb: 2 }}
                >
                    Add Train Connection ({connections.length}/{MAX_CONNECTIONS})
                </Button>
            )}
        </>
    )
}
