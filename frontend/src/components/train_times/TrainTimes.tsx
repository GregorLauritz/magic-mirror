import Typography from '@mui/material/Typography'
import { Box, Skeleton, Stack, IconButton } from '@mui/material'
import { MediumCard } from '../CardFrame'
import { memo, useState, useEffect } from 'react'
import { useGetTrainConnections } from '../../apis/trains'
import { useGetUserSettings } from '../../apis/user_settings'
import { TrainConnection as TrainConnectionType } from '../../models/trains'
import { PAPER_CARD_COLOR, xSmallFontSize } from '../../assets/styles/theme'
import ErrorCard from '../error_card/ErrorCard'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

const TrainTimesComponent = () => {
    const { data: userSettings } = useGetUserSettings(false)

    const trainConnections = userSettings?.train_connections || []
    const trainDisplaySettings = userSettings?.train_display_settings || {
        mode: 'carousel',
        carouselInterval: 15,
    }

    // Backward compatibility: if no train_connections but legacy fields exist, use them
    const hasLegacySettings =
        !trainConnections.length &&
        userSettings?.train_departure_station_id &&
        userSettings?.train_arrival_station_id

    if (hasLegacySettings) {
        trainConnections.push({
            id: 'legacy',
            departureStationId: userSettings!.train_departure_station_id!,
            departureStationName: userSettings!.train_departure_station_name || '',
            arrivalStationId: userSettings!.train_arrival_station_id!,
            arrivalStationName: userSettings!.train_arrival_station_name || '',
        })
    }

    if (trainConnections.length === 0) {
        return (
            <ErrorCard
                Card={MediumCard}
                error="No train connections configured. Please add them in the settings"
                showSettingsBtn
            />
        )
    }

    // Display mode: carousel or multiple
    if (trainDisplaySettings.mode === 'carousel') {
        return (
            <TrainTimesCarousel
                trainConnections={trainConnections}
                carouselInterval={trainDisplaySettings.carouselInterval}
            />
        )
    }

    // Display mode: multiple cards
    return (
        <>
            {trainConnections.map((connection) => (
                <TrainTimesCard
                    key={connection.id}
                    departureStationId={connection.departureStationId}
                    arrivalStationId={connection.arrivalStationId}
                    departureStationName={connection.departureStationName}
                    arrivalStationName={connection.arrivalStationName}
                />
            ))}
        </>
    )
}

interface TrainTimesCarouselProps {
    trainConnections: Array<{
        id: string
        departureStationId: string
        departureStationName: string
        arrivalStationId: string
        arrivalStationName: string
    }>
    carouselInterval: number
}

const TrainTimesCarouselComponent = ({
    trainConnections,
    carouselInterval,
}: TrainTimesCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (trainConnections.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % trainConnections.length)
        }, carouselInterval * 1000)

        return () => clearInterval(interval)
    }, [trainConnections.length, carouselInterval])

    const handlePrevious = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? trainConnections.length - 1 : prev - 1
        )
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % trainConnections.length)
    }

    const currentConnection = trainConnections[currentIndex]

    return (
        <TrainTimesCard
            departureStationId={currentConnection.departureStationId}
            arrivalStationId={currentConnection.arrivalStationId}
            departureStationName={currentConnection.departureStationName}
            arrivalStationName={currentConnection.arrivalStationName}
            showCarouselControls={trainConnections.length > 1}
            currentIndex={currentIndex}
            totalConnections={trainConnections.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
        />
    )
}

const TrainTimesCarousel = memo(TrainTimesCarouselComponent)
TrainTimesCarousel.displayName = 'TrainTimesCarousel'

interface TrainTimesCardProps {
    departureStationId: string
    arrivalStationId: string
    departureStationName: string
    arrivalStationName: string
    showCarouselControls?: boolean
    currentIndex?: number
    totalConnections?: number
    onPrevious?: () => void
    onNext?: () => void
}

const TrainTimesCardComponent = ({
    departureStationId,
    arrivalStationId,
    departureStationName,
    arrivalStationName,
    showCarouselControls = false,
    currentIndex = 0,
    totalConnections = 1,
    onPrevious,
    onNext,
}: TrainTimesCardProps) => {
    const enabled = !!departureStationId && !!arrivalStationId

    const {
        data: connections,
        isLoading,
        error,
    } = useGetTrainConnections(departureStationId, arrivalStationId, enabled)

    return (
        <MediumCard>
            <Box height="100%">
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom={1}
                >
                    <Typography variant="body1">Train Times</Typography>
                    {showCarouselControls && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <IconButton
                                size="small"
                                onClick={onPrevious}
                                sx={{ padding: 0.5 }}
                            >
                                <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                            <Typography
                                variant="body2"
                                fontSize={xSmallFontSize}
                                color="text.secondary"
                            >
                                {currentIndex + 1}/{totalConnections}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={onNext}
                                sx={{ padding: 0.5 }}
                            >
                                <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                </Box>
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

const TrainTimesCard = memo(TrainTimesCardComponent)
TrainTimesCard.displayName = 'TrainTimesCard'

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
