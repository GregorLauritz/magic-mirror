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
        carousel_interval: 15,
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
                carouselInterval={trainDisplaySettings.carousel_interval}
            />
        )
    }

    // Display mode: multiple cards
    return (
        <>
            {trainConnections.map((connection) => (
                <TrainTimesCard
                    key={connection.id}
                    departure_station_id={connection.departure_station_id}
                    arrival_station_id={connection.arrival_station_id}
                    departure_station_name={connection.departure_station_name}
                    arrival_station_name={connection.arrival_station_name}
                />
            ))}
        </>
    )
}

interface TrainTimesCarouselProps {
    trainConnections: Array<{
        id: string
        departure_station_id: string
        departure_station_name: string
        arrival_station_id: string
        arrival_station_name: string
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
            departure_station_id={currentConnection.departure_station_id}
            arrival_station_id={currentConnection.arrival_station_id}
            departure_station_name={currentConnection.departure_station_name}
            arrival_station_name={currentConnection.arrival_station_name}
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
    departure_station_id: string
    arrival_station_id: string
    departure_station_name: string
    arrival_station_name: string
    showCarouselControls?: boolean
    currentIndex?: number
    totalConnections?: number
    onPrevious?: () => void
    onNext?: () => void
}

const TrainTimesCardComponent = ({
    departure_station_id,
    arrival_station_id,
    departure_station_name,
    arrival_station_name,
    showCarouselControls = false,
    currentIndex = 0,
    totalConnections = 1,
    onPrevious,
    onNext,
}: TrainTimesCardProps) => {
    const enabled = !!departure_station_id && !!arrival_station_id

    const {
        data: connections,
        isLoading,
        error,
    } = useGetTrainConnections(
        departure_station_id,
        arrival_station_id,
        enabled
    )

    return (
        <MediumCard>
            <Box sx={{ height: '100%' }}>
                <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}
                >
                    <Typography variant="body1">Train Times</Typography>
                    {showCarouselControls && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                size="small"
                                onClick={onPrevious}
                                sx={{ padding: 0.5 }}
                            >
                                <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ ...xSmallFontSize }}
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
                    color="text.secondary"
                    sx={{ ...xSmallFontSize, marginBottom: 2 }}
                >
                    {departure_station_name} → {arrival_station_name}
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
                        <Typography color="error" sx={{ ...xSmallFontSize }}>
                            Error loading train connections
                        </Typography>
                    )}

                    {!isLoading &&
                        !error &&
                        connections &&
                        connections.length === 0 && (
                            <Typography
                                color="text.secondary"
                                sx={{ ...xSmallFontSize }}
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

    const isCancelled = connection.legs.some(
        (leg) => !leg.walking && leg.cancelled
    )

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
                borderColor: isCancelled ? 'error.main' : 'divider',
            }}
        >
            <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 'bold',
                            ...(isCancelled
                                ? { textDecoration: 'line-through', color: 'text.disabled' }
                                : undefined),
                        }}
                    >
                        {formatTime(departureTime)} → {formatTime(arrivalTime)}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ...xSmallFontSize }}
                    >
                        {connection.legs
                            .filter((leg) => !leg.walking)
                            .map((leg) => leg.line)
                            .join(' → ')}{' '}
                        • {formatDuration(connection.duration)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    {isCancelled ? (
                        <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ ...xSmallFontSize }}
                        >
                            Cancelled
                        </Typography>
                    ) : (
                        <>
                            {connection.departurePlatform && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ...xSmallFontSize }}
                                >
                                    Platform {connection.departurePlatform}
                                </Typography>
                            )}
                            {connection.delay !== undefined &&
                                connection.delay > 0 && (
                                    <Typography
                                        variant="body2"
                                        color={getDelayColor(connection.delay)}
                                        sx={{ ...xSmallFontSize }}
                                    >
                                        +{connection.delay / 60} min
                                    </Typography>
                                )}
                        </>
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
