import { useMemo } from 'react'
import { Box, IconButton, Paper } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import type { SavedRoute, StationRef } from '@/domain/settings/UserSettings'
import type { Station } from '@/domain/trains/types'
import { StationAutocomplete } from '@/features/trains'

interface TrainRouteEditorProps {
    readonly route: SavedRoute
    readonly onUpdate: (route: SavedRoute) => void
    readonly onRemove: (id: string) => void
}

const NO_STATION: StationRef = { id: '', name: '' }

const chosen = (station: StationRef): Station | null =>
    station.id === '' ? null : station

const toRef = (station: Station | null): StationRef =>
    station ? { id: station.id, name: station.name } : NO_STATION

/** Two station pickers for one saved connection, and a way to remove it. */
export const TrainRouteEditor = ({
    route,
    onUpdate,
    onRemove,
}: TrainRouteEditorProps) => {
    const from = useMemo(() => chosen(route.from), [route.from])
    const to = useMemo(() => chosen(route.to), [route.to])

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 2, position: 'relative' }}>
            <IconButton
                size="small"
                aria-label="Remove connection"
                onClick={() => onRemove(route.id)}
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            >
                <DeleteIcon />
            </IconButton>

            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, pr: 4 }}
            >
                <StationAutocomplete
                    label="Departure Station"
                    value={from}
                    onChange={(station) =>
                        onUpdate({ ...route, from: toRef(station) })
                    }
                />
                <StationAutocomplete
                    label="Arrival Station"
                    value={to}
                    onChange={(station) =>
                        onUpdate({ ...route, to: toRef(station) })
                    }
                />
            </Box>
        </Paper>
    )
}
