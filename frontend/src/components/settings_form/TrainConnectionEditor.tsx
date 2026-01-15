import { Box, IconButton, Paper } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { TrainConnection } from '../../models/user_settings'
import { TrainStation } from '../../models/trains'
import { StationAutocomplete } from './StationAutocomplete'
import { useMemo } from 'react'

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
            connection.departureStationId
                ? {
                      id: connection.departureStationId,
                      name: connection.departureStationName,
                  }
                : null,
        [connection.departureStationId, connection.departureStationName]
    )

    const arrivalStation: TrainStation | null = useMemo(
        () =>
            connection.arrivalStationId
                ? {
                      id: connection.arrivalStationId,
                      name: connection.arrivalStationName,
                  }
                : null,
        [connection.arrivalStationId, connection.arrivalStationName]
    )

    const handleDepartureChange = (station: TrainStation | null) => {
        onUpdate({
            ...connection,
            departureStationId: station?.id || '',
            departureStationName: station?.name || '',
        })
    }

    const handleArrivalChange = (station: TrainStation | null) => {
        onUpdate({
            ...connection,
            arrivalStationId: station?.id || '',
            arrivalStationName: station?.name || '',
        })
    }

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
