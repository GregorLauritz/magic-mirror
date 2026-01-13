import Typography from '@mui/material/Typography'
import unknownWeatherIcon from '../../assets/unknown-weather.svg'
import { CardMedia, Grid, Skeleton, Stack } from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { PADDING, smallFontSize } from '../../assets/styles/theme'
import { useGetCurrentWeather } from '../../apis/current_weather'
import { MediumCard } from '../CardFrame'
import { useGetWeatherIcon } from '../../apis/weather_icon'
import { memo, useMemo } from 'react'
import { useLocation } from '../../hooks/useLocation'
import ErrorCard from '../error_card/ErrorCard'
import { CurrentWeatherResource } from '../../models/current_weather'
import { useTimeContext } from '../../hooks/useTimeContext'
import { CARD_HEIGHT } from '../../assets/styles/cards'

interface WeatherInfoProps {
    weather: CurrentWeatherResource
}

const WeatherInfo = memo<WeatherInfoProps>(({ weather }) => {
    const precipitationValue = useMemo(
        () =>
            weather.precipitation.value !== null
                ? weather.precipitation.value.toFixed(1)
                : '-',
        [weather.precipitation.value]
    )

    return (
        <>
            <Typography variant="h3">
                {weather.temperature.current.toFixed()}
                {weather.temperature.unit}
            </Typography>
            <Stack direction="row">
                <ArrowDropUpIcon />
                <Typography variant="subtitle1" color="text.primary">
                    {weather.temperature.max.toFixed()}
                    {weather.temperature.unit}
                </Typography>
                <ArrowDropDownIcon />
                <Typography variant="subtitle1" color="text.primary">
                    {weather.temperature.min.toFixed()}
                    {weather.temperature.unit}
                </Typography>
            </Stack>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Feels like {weather.temperature.feels_like.toFixed()}
                {weather.temperature.unit}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Precipitation: {precipitationValue} {weather.precipitation.unit}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Windspeed: {weather.windspeed.value} {weather.windspeed.unit}
            </Typography>
        </>
    )
})

WeatherInfo.displayName = 'WeatherInfo'

const CurrentWeatherComponent = () => {
    const { longitude, latitude, isLoading: isLocationLoading } = useLocation()
    const { timeZone } = useTimeContext()
    const {
        data: weather,
        isLoading: isWeatherLoading,
        error,
    } = useGetCurrentWeather(longitude, latitude, !isLocationLoading, timeZone)

    const {
        data: icon,
        isLoading: isIconLoading,
        error: iconError,
    } = useGetWeatherIcon(
        weather?.weather_icon ?? '',
        '4x',
        !isLocationLoading &&
            !isWeatherLoading &&
            weather?.weather_icon !== undefined
    )

    const isLoadingData = isIconLoading || isWeatherLoading || isLocationLoading

    const weatherIconJsx = useMemo(() => {
        if (isLoadingData) {
            return <Skeleton variant="rounded" height={125} />
        }
        return (
            <CardMedia
                component="img"
                src={iconError || !icon ? unknownWeatherIcon : icon}
                alt="Current Weather Icon"
                loading="lazy"
                sx={{
                    maxHeight: CARD_HEIGHT - PADDING * 3,
                    objectFit: 'contain',
                }}
            />
        )
    }, [isLoadingData, iconError, icon])

    const weatherData = useMemo(() => {
        if (isLoadingData) {
            return (
                <>
                    <Skeleton variant="rounded" height={80} />
                    <Skeleton variant="rounded" />
                    <Skeleton variant="rounded" />
                </>
            )
        }

        if (error || !weather) {
            return (
                <Typography color="text.secondary">
                    Error loading weather
                </Typography>
            )
        }

        return <WeatherInfo weather={weather} />
    }, [isLoadingData, error, weather])

    if ((!longitude || !latitude) && !isLocationLoading) {
        return (
            <ErrorCard
                Card={MediumCard}
                error="Longitude and or latitude are not set. Please update your location in the settings"
                showSettingsBtn
            />
        )
    }

    return (
        <MediumCard>
            <Grid container spacing={1}>
                <Grid size={6}>
                    <Stack spacing={1}>{weatherData}</Stack>
                </Grid>
                <Grid size={6}>{weatherIconJsx}</Grid>
            </Grid>
        </MediumCard>
    )
}

const CurrentWeather = memo(CurrentWeatherComponent)
CurrentWeather.displayName = 'CurrentWeather'

export default CurrentWeather
