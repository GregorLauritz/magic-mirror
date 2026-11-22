import { memo } from 'react'
import { Grid, Skeleton, Stack, Typography } from '@mui/material'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { TimeZoneId } from '@/domain/shared/time'
import type { HourlyEntry } from '@/domain/weather/types'
import { formatTimeOfDay, useTimeZone } from '@/features/time'
import { smallFontSize } from '@/shared/styles/theme'
import { MediumCard } from '@/shared/ui/CardFrame'
import { HOURLY_FORECAST_HOURS } from './constants'
import { CoordinatesGate } from './CoordinatesGate'
import { plain, rounded } from './format'
import { useHourlyForecast } from './hooks/useHourlyForecast'
import { WeatherIcon } from './WeatherIcon'

const HourlyItemSkeleton = () => (
    <Stack direction="column" spacing={1}>
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
    </Stack>
)

const HourlyItem = ({
    entry,
    timeZone,
}: {
    entry: HourlyEntry
    timeZone: TimeZoneId
}) => (
    <Stack direction="column" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Typography variant="subtitle2" color="text.primary" align="center">
            {formatTimeOfDay(entry.at, timeZone)}
        </Typography>
        <WeatherIcon condition={entry.condition} />
        <Typography
            variant="subtitle2"
            color="text.primary"
            align="center"
            sx={smallFontSize}
        >
            {rounded(entry.temperature)}
            {entry.temperature.unit}
        </Typography>
        <Typography
            variant="subtitle2"
            color="text.primary"
            align="center"
            sx={smallFontSize}
        >
            {plain(entry.precipitation)} {entry.precipitation.unit}
        </Typography>
        <Typography
            variant="subtitle2"
            color="text.primary"
            align="center"
            sx={smallFontSize}
        >
            {plain(entry.windSpeed)} {entry.windSpeed.unit}
        </Typography>
    </Stack>
)

interface ViewProps {
    readonly entries: readonly HourlyEntry[] | undefined
    readonly isLoading: boolean
    readonly timeZone: TimeZoneId
}

const HourlyForecastView = ({ entries, isLoading, timeZone }: ViewProps) => {
    let content
    if (isLoading) {
        content = Array.from({ length: HOURLY_FORECAST_HOURS }, (_, i) => (
            <Grid size={2} key={i}>
                <HourlyItemSkeleton />
            </Grid>
        ))
    } else if (entries) {
        content = entries.map((entry) => (
            <Grid size={2} key={entry.at}>
                <HourlyItem entry={entry} timeZone={timeZone} />
            </Grid>
        ))
    } else {
        content = (
            <Typography color="text.secondary">
                Error loading forecast
            </Typography>
        )
    }

    return (
        <MediumCard>
            <Grid container spacing={1} columns={10}>
                {content}
            </Grid>
        </MediumCard>
    )
}

/** The hourly forecast card for a known location. */
export const HourlyForecastBody = memo(
    ({ coordinates }: { coordinates: Coordinates }) => {
        const { entries, isLoading } = useHourlyForecast(coordinates)
        const timeZone = useTimeZone()
        return (
            <HourlyForecastView
                entries={entries}
                isLoading={isLoading}
                timeZone={timeZone}
            />
        )
    }
)
HourlyForecastBody.displayName = 'HourlyForecastBody'

export const HourlyForecastWidget = memo(() => {
    const timeZone = useTimeZone()
    return (
        <CoordinatesGate
            Card={MediumCard}
            loading={
                <HourlyForecastView
                    entries={undefined}
                    isLoading
                    timeZone={timeZone}
                />
            }
        >
            {(coordinates) => <HourlyForecastBody coordinates={coordinates} />}
        </CoordinatesGate>
    )
})
HourlyForecastWidget.displayName = 'HourlyForecastWidget'
