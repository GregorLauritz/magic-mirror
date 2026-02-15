import { Box, IconButton, Paper } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { TrainConnection } from '../../models/user_settings'
import { TrainStation } from '../../models/trains'
import { StationAutocomplete } from './StationAutocomplete'
import { useCallback, useMemo } from 'react'

interface TrainConnectionEditorProps {
    connection: TrainConnection
    onUpdate: (connection: TrainConnection) => void
    onRemove: (id: string) => void
}

export const TrainConnectionEditor = ({
    connection,
    onUpdate,
    onRemove,
}: TrainConnectionEditorProps) => {
    const departureStation: TrainStation | null = useMemo(
        () =>
            connection.departure_station_id
                ? {
                      id: connection.departure_station_id,
                      name: connection.departure_station_name,
                  }
                : null,
        [connection.departure_station_id, connection.departure_station_name]
    )

    const arrivalStation: TrainStation | null = useMemo(
        () =>
            connection.arrival_station_id
                ? {
                      id: connection.arrival_station_id,
                      name: connection.arrival_station_name,
                  }
                : null,
        [connection.arrival_station_id, connection.arrival_station_name]
    )

    const handleDepartureChange = useCallback(
        (station: TrainStation | null) => {
            onUpdate({
                ...connection,
                departure_station_id: station?.id || '',
                departure_station_name: station?.name || '',
            })
        },
        [connection, onUpdate]
    )

    const handleArrivalChange = useCallback(
        (station: TrainStation | null) => {
            onUpdate({
                ...connection,
                arrival_station_id: station?.id || '',
                arrival_station_name: station?.name || '',
            })
        },
        [connection, onUpdate]
    )

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
                    zIndex: 1,
                }}
            >
                <DeleteIcon />
            </IconButton>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    pr: 4,
                }}
            >
                <StationAutocomplete
                    label="Departure Station"
                    value={departureStation}
                    onChange={handleDepartureChange}
                />
                <StationAutocomplete
                    label="Arrival Station"
                    value={arrivalStation}
                    onChange={handleArrivalChange}
                />
            </Box>
        </Paper>
    )
}
