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
import { MAX_TRAIN_ROUTES } from '@/domain/settings/settingsRules'
import type {
    SavedRoute,
    TrainDisplayMode,
} from '@/domain/settings/UserSettings'
import { TrainRouteEditor } from './TrainRouteEditor'

interface TrainSectionProps {
    readonly routes: readonly SavedRoute[]
    readonly mode: TrainDisplayMode
    readonly intervalText: string
    readonly onModeChange: (mode: TrainDisplayMode) => void
    readonly onIntervalChange: (text: string) => void
    /** The interval field was left: time to correct what was typed. */
    readonly onIntervalCommit: () => void
    readonly onAdd: () => void
    readonly onRemove: (id: string) => void
    readonly onUpdate: (route: SavedRoute) => void
}

/** Which train connections to show, and how. */
export const TrainSection = ({
    routes,
    mode,
    intervalText,
    onModeChange,
    onIntervalChange,
    onIntervalCommit,
    onAdd,
    onRemove,
    onUpdate,
}: TrainSectionProps) => (
    <>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
            Train Connections (optional)
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
                <InputLabel id="train-mode-label">Display Mode</InputLabel>
                <Select
                    labelId="train-mode-label"
                    id="train-mode"
                    value={mode}
                    label="Display Mode"
                    onChange={(event) =>
                        onModeChange(event.target.value as TrainDisplayMode)
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
                value={intervalText}
                onChange={(event) => onIntervalChange(event.target.value)}
                onBlur={onIntervalCommit}
                disabled={mode !== 'carousel'}
                fullWidth
            />
        </Box>

        {routes.map((route) => (
            <TrainRouteEditor
                key={route.id}
                route={route}
                onUpdate={onUpdate}
                onRemove={onRemove}
            />
        ))}

        {routes.length < MAX_TRAIN_ROUTES && (
            <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAdd}
                sx={{ mb: 2 }}
            >
                {`Add Train Connection (${routes.length}/${MAX_TRAIN_ROUTES})`}
            </Button>
        )}
    </>
)
