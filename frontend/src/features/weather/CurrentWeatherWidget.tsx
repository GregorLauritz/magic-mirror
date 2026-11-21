import { memo } from 'react'
import { CardMedia, Grid, Skeleton, Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import type { Coordinates } from '@/domain/location/Coordinates'
import type { CurrentWeather } from '@/domain/weather/types'
import { CARD_HEIGHT } from '@/shared/styles/cards'
import { PADDING, smallFontSize } from '@/shared/styles/theme'
import { MediumCard } from '@/shared/ui/CardFrame'
import { CoordinatesGate } from './CoordinatesGate'
import { fixed, plain } from './format'
import { useCurrentWeather } from './hooks/useCurrentWeather'
import { useWeatherIcon } from './useWeatherIcon'

const WeatherInfo = ({ weather }: { weather: CurrentWeather }) => {
    const unit = weather.temperature.unit
    return (
        <>
            <Typography variant="h3">
                {fixed(weather.temperature)}
                {unit}
            </Typography>
            <Stack direction="row">
                <ArrowDropUpIcon />
                <Typography variant="subtitle1" color="text.primary">
                    {fixed(weather.todayMax)}
                    {weather.todayMax.unit}
                </Typography>
                <ArrowDropDownIcon />
                <Typography variant="subtitle1" color="text.primary">
                    {fixed(weather.todayMin)}
                    {weather.todayMin.unit}
                </Typography>
            </Stack>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Feels like {fixed(weather.apparentTemperature)}
                {weather.apparentTemperature.unit}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Precipitation: {fixed(weather.precipitationToday, 1)}{' '}
                {weather.precipitationToday.unit}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Windspeed: {plain(weather.windSpeed)} {weather.windSpeed.unit}
            </Typography>
        </>
    )
}

const WeatherIconPanel = ({ weather }: { weather: CurrentWeather }) => {
    const { src, alt } = useWeatherIcon(weather.condition)
    return (
        <CardMedia
            component="img"
            src={src}
            alt={alt}
            loading="lazy"
            sx={{ maxHeight: CARD_HEIGHT - PADDING * 3, objectFit: 'contain' }}
        />
    )
}

interface ViewProps {
    readonly weather: CurrentWeather | undefined
    readonly isLoading: boolean
}

const CurrentWeatherView = ({ weather, isLoading }: ViewProps) => {
    let details = (
        <Typography color="text.secondary">Error loading weather</Typography>
    )
    let icon = null
    if (isLoading) {
        details = (
            <>
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" />
                <Skeleton variant="rounded" />
            </>
        )
        icon = <Skeleton variant="rounded" height={125} />
    } else if (weather) {
        details = <WeatherInfo weather={weather} />
        icon = <WeatherIconPanel weather={weather} />
    }

    return (
        <MediumCard>
            <Grid container spacing={1}>
                <Grid size={6}>
                    <Stack spacing={1}>{details}</Stack>
                </Grid>
                <Grid size={6}>{icon}</Grid>
            </Grid>
        </MediumCard>
    )
}

/** The current-weather card for a known location. */
export const CurrentWeatherBody = memo(
    ({ coordinates }: { coordinates: Coordinates }) => {
        const { data, isLoading } = useCurrentWeather(coordinates)
        return <CurrentWeatherView weather={data} isLoading={isLoading} />
    }
)
CurrentWeatherBody.displayName = 'CurrentWeatherBody'

export const CurrentWeatherWidget = memo(() => (
    <CoordinatesGate
        Card={MediumCard}
        loading={<CurrentWeatherView weather={undefined} isLoading />}
    >
        {(coordinates) => <CurrentWeatherBody coordinates={coordinates} />}
    </CoordinatesGate>
))
CurrentWeatherWidget.displayName = 'CurrentWeatherWidget'
