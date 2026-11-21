import { memo } from 'react'
import { Box, Typography } from '@mui/material'
import {
    delayMinutes,
    delaySeverity,
    isCancelled,
} from '@/domain/trains/journeyRules'
import type { Journey } from '@/domain/trains/types'
import { formatTimeOfDay, useTimeZone } from '@/features/time'
import { PAPER_CARD_COLOR, xSmallFontSize } from '@/shared/styles/theme'
import { journeySummary } from './trainPresentation'

const DELAY_COLOR = {
    none: 'text.primary',
    minor: 'warning.main',
    major: 'error.main',
} as const

const cancelledStyle = {
    textDecoration: 'line-through',
    color: 'text.disabled',
} as const

/** One journey: when, which trains, how long, and what to know before leaving. */
export const JourneyRow = memo(({ journey }: { journey: Journey }) => {
    const timeZone = useTimeZone()
    const cancelled = isCancelled(journey)
    const minutesLate = delayMinutes(journey)

    return (
        <Box
            sx={{
                padding: 1,
                borderRadius: 1,
                backgroundColor: PAPER_CARD_COLOR,
                border: 1,
                borderColor: cancelled ? 'error.main' : 'divider',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 'bold',
                            ...(cancelled ? cancelledStyle : undefined),
                        }}
                    >
                        {formatTimeOfDay(journey.departure, timeZone)} →{' '}
                        {formatTimeOfDay(journey.arrival, timeZone)}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={xSmallFontSize}
                    >
                        {journeySummary(journey)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    {cancelled ? (
                        <Typography
                            variant="body2"
                            color="error.main"
                            sx={xSmallFontSize}
                        >
                            Cancelled
                        </Typography>
                    ) : (
                        <>
                            {journey.departurePlatform && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={xSmallFontSize}
                                >
                                    Platform {journey.departurePlatform}
                                </Typography>
                            )}
                            {minutesLate > 0 && (
                                <Typography
                                    variant="body2"
                                    color={DELAY_COLOR[delaySeverity(journey)]}
                                    sx={xSmallFontSize}
                                >
                                    +{minutesLate} min
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    )
})
JourneyRow.displayName = 'JourneyRow'
