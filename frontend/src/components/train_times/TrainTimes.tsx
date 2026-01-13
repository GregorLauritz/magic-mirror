import Typography from '@mui/material/Typography'
import { Box, Skeleton, Stack } from '@mui/material'
import { MediumCard } from '../CardFrame'
import { memo } from 'react'
import { useGetTrainConnections } from '../../apis/trains'
import { useGetUserSettings } from '../../apis/user_settings'
import { TrainConnection as TrainConnectionType } from '../../models/trains'
import { PAPER_CARD_COLOR, xSmallFontSize } from '../../assets/styles/theme'
import ErrorCard from '../error_card/ErrorCard'

const TrainTimesComponent = () => {
    const { data: userSettings } = useGetUserSettings(false)

    const departureStationId = userSettings?.train_departure_station_id
    const arrivalStationId = userSettings?.train_arrival_station_id
    const departureStationName = userSettings?.train_departure_station_name
    const arrivalStationName = userSettings?.train_arrival_station_name

    const enabled = !!departureStationId && !!arrivalStationId

    const {
        data: connections,
        isLoading,
        error,
    } = useGetTrainConnections(departureStationId, arrivalStationId, enabled)

    if (!enabled && !isLoading) {
        return (
            <ErrorCard
                Card={MediumCard}
                error="Departure and or arrival station are not set. Please set them in the settings"
                showSettingsBtn
            />
        )
    }

    return (
        <MediumCard>
            <Box height="100%">
                <Typography variant="body1" marginBottom={1}>
                    Train Times
                </Typography>
                <Typography
                    variant="body2"
                    fontSize={xSmallFontSize}
                    color="text.secondary"
                    marginBottom={2}
                >
                    {departureStationName} → {arrivalStationName}
                </Typography>
                <Stack spacing={1} direction="column">
                    {isLoading && (
                        <>
                            {Array.from({ length: 2 }, (_, index) => (
                                <Skeleton
                                    key={index}
                                    variant="rounded"
                                    height={50}
                                />
                            ))}
                        </>
                    )}

                    {error && (
                        <Typography color="error" fontSize={xSmallFontSize}>
                            Error loading train connections
                        </Typography>
                    )}

                    {!isLoading &&
                        !error &&
                        connections &&
                        connections.length === 0 && (
                            <Typography
                                color="text.secondary"
                                fontSize={xSmallFontSize}
                            >
                                No connections found
                            </Typography>
                        )}

                    {!isLoading &&
                        !error &&
                        connections &&
                        connections
                            .slice(0, 2)
                            .map((connection, index) => (
                                <TrainConnection
                                    key={`${connection.departure}-${index}`}
                                    connection={connection}
                                />
                            ))}
                </Stack>
            </Box>
        </MediumCard>
    )
}

interface TrainConnectionProps {
    connection: TrainConnectionType
}

const TrainConnectionComponent = ({ connection }: TrainConnectionProps) => {
    const departureTime = new Date(connection.departure)
    const arrivalTime = new Date(connection.arrival)

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    const getDelayColor = (delay?: number): string => {
        if (!delay || delay === 0) return 'text.primary'
        if (delay > 0 && delay <= 300) return 'warning.main'
        return 'error.main'
    }

    return (
        <Box
            sx={{
                padding: 1,
                borderRadius: 1,
                backgroundColor: PAPER_CARD_COLOR,
                border: 1,
                borderColor: 'divider',
            }}
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {formatTime(departureTime)} → {formatTime(arrivalTime)}
                    </Typography>
                    <Typography
                        variant="body2"
                        fontSize={xSmallFontSize}
                        color="text.secondary"
                    >
                        {connection.line} •{' '}
                        {formatDuration(connection.duration)}
                    </Typography>
                </Box>
                <Box textAlign="right">
                    {connection.departurePlatform && (
                        <Typography
                            variant="body2"
                            fontSize={xSmallFontSize}
                            color="text.secondary"
                        >
                            Platform {connection.departurePlatform}
                        </Typography>
                    )}
                    {connection.delay !== undefined && connection.delay > 0 && (
                        <Typography
                            variant="body2"
                            fontSize={xSmallFontSize}
                            color={getDelayColor(connection.delay)}
                        >
                            +{connection.delay / 60} min
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    )
}

const TrainConnection = memo(TrainConnectionComponent)
TrainConnection.displayName = 'TrainConnection'

const TrainTimes = memo(TrainTimesComponent)
TrainTimes.displayName = 'TrainTimes'

export default TrainTimes
