import { memo } from 'react'
import { Grid, Skeleton, Stack, Typography } from '@mui/material'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { DailyEntry } from '@/domain/weather/types'
import { formatWeekday, useLocale } from '@/features/time'
import { smallFontSize } from '@/shared/styles/theme'
import { MediumCard } from '@/shared/ui/CardFrame'
import { DAILY_FORECAST_DAYS } from './constants'
import { CoordinatesGate } from './CoordinatesGate'
import { plain, rounded } from './format'
import { useDailyForecast } from './hooks/useDailyForecast'
import { WeatherIcon } from './WeatherIcon'

const DailyItemSkeleton = () => (
    <Stack direction="column" spacing={1}>
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" height={50} />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
    </Stack>
)

const DailyItem = ({
    entry,
    locale,
}: {
    entry: DailyEntry
    locale: string
}) => (
    <Stack direction="column" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Typography variant="subtitle2" color="text.primary" align="center">
            {formatWeekday(entry.date, locale)}
        </Typography>
        <WeatherIcon condition={entry.condition} />
        <Stack direction="row" sx={{ justifyContent: 'center' }}>
            <Typography
                variant="subtitle2"
                color="text.primary"
                sx={{ fontWeight: 'bold', ...smallFontSize }}
            >
                {rounded(entry.tempMax)}
                {entry.tempMax.unit}
            </Typography>
            &nbsp;
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                {rounded(entry.tempMin)}
                {entry.tempMin.unit}
            </Typography>
        </Stack>
        <Typography
            variant="subtitle2"
            color="text.primary"
            align="center"
            sx={smallFontSize}
        >
            {plain(entry.precipitationSum)} {entry.precipitationSum.unit}
        </Typography>
        <Typography
            variant="subtitle2"
            color="text.primary"
            align="center"
            sx={smallFontSize}
        >
            {plain(entry.maxWindSpeed)} {entry.maxWindSpeed.unit}
        </Typography>
    </Stack>
)

interface ViewProps {
    readonly days: readonly DailyEntry[] | undefined
    readonly isLoading: boolean
    readonly locale: string
}

const DailyForecastView = ({ days, isLoading, locale }: ViewProps) => {
    let content
    if (isLoading) {
        content = Array.from({ length: DAILY_FORECAST_DAYS }, (_, i) => (
            <Grid size={3} key={i}>
                <DailyItemSkeleton />
            </Grid>
        ))
    } else if (days) {
        content = days.map((entry) => (
            <Grid size={3} key={entry.date}>
                <DailyItem entry={entry} locale={locale} />
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
            <Grid container spacing={1}>
                {content}
            </Grid>
        </MediumCard>
    )
}

/** The daily forecast card for a known location. */
export const DailyForecastBody = memo(
    ({ coordinates }: { coordinates: Coordinates }) => {
        const { days, isLoading } = useDailyForecast(coordinates)
        const locale = useLocale()
        return (
            <DailyForecastView
                days={days}
                isLoading={isLoading}
                locale={locale}
            />
        )
    }
)
DailyForecastBody.displayName = 'DailyForecastBody'

export const DailyForecastWidget = memo(() => {
    const locale = useLocale()
    return (
        <CoordinatesGate
            Card={MediumCard}
            loading={
                <DailyForecastView days={undefined} isLoading locale={locale} />
            }
        >
            {(coordinates) => <DailyForecastBody coordinates={coordinates} />}
        </CoordinatesGate>
    )
})
DailyForecastWidget.displayName = 'DailyForecastWidget'
