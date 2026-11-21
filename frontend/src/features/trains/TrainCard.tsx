import { memo } from 'react'
import { Box, IconButton, Skeleton, Stack, Typography } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import type { SavedRoute } from '@/domain/settings/UserSettings'
import { xSmallFontSize } from '@/shared/styles/theme'
import { MediumCard } from '@/shared/ui/CardFrame'
import { JOURNEY_LIMIT } from './constants'
import { useJourneys } from './hooks/useJourneys'
import { JourneyRow } from './JourneyRow'

export interface CarouselControls {
    readonly index: number
    readonly count: number
    readonly onPrevious: () => void
    readonly onNext: () => void
}

const Controls = ({ index, count, onPrevious, onNext }: CarouselControls) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
            size="small"
            aria-label="Previous connection"
            onClick={onPrevious}
            sx={{ padding: 0.5 }}
        >
            <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={xSmallFontSize}>
            {index + 1}/{count}
        </Typography>
        <IconButton
            size="small"
            aria-label="Next connection"
            onClick={onNext}
            sx={{ padding: 0.5 }}
        >
            <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
    </Box>
)

interface TrainCardProps {
    readonly route: SavedRoute
    /** Only in a carousel of more than one connection. */
    readonly controls?: CarouselControls
}

/** The next journeys of one saved connection. */
export const TrainCard = memo(({ route, controls }: TrainCardProps) => {
    const { journeys, isLoading, isError } = useJourneys(
        route.from.id,
        route.to.id
    )

    let content
    if (journeys) {
        content =
            journeys.length === 0 ? (
                <Typography color="text.secondary" sx={xSmallFontSize}>
                    No connections found
                </Typography>
            ) : (
                journeys
                    .slice(0, JOURNEY_LIMIT)
                    .map((journey, index) => (
                        <JourneyRow
                            key={`${journey.departure}-${index}`}
                            journey={journey}
                        />
                    ))
            )
    } else if (isError) {
        content = (
            <Typography color="error" sx={xSmallFontSize}>
                Error loading train connections
            </Typography>
        )
    } else if (isLoading) {
        content = Array.from({ length: JOURNEY_LIMIT }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={50} />
        ))
    }

    return (
        <MediumCard>
            <Box sx={{ height: '100%' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 1,
                    }}
                >
                    <Typography variant="body1">Train Times</Typography>
                    {controls && <Controls {...controls} />}
                </Box>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ...xSmallFontSize, marginBottom: 2 }}
                >
                    {route.from.name} → {route.to.name}
                </Typography>
                <Stack spacing={1} direction="column">
                    {content}
                </Stack>
            </Box>
        </MediumCard>
    )
})
TrainCard.displayName = 'TrainCard'
