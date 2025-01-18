import Typography from '@mui/material/Typography'
import unknownWeatherIcon from '../../assets/unknown-weather.svg'
import { TEMP_UNIT, PRECIPITATION_UNIT } from '../../constants/weather'
import { CardMedia, Grid, Skeleton, Stack } from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { smallFontSize } from '../../assets/styles/theme'
import { useGetCurrentWeather } from '../../apis/current_weather'
import { MediumCard } from '../CardFrame'
import { useGetWeatherIcon } from '../../apis/weather_icon'
import React, { useContext, useMemo } from 'react'
import { LocationContext } from '../../common/LocationContext'
import ErrorCard from '../error_card/ErrorCard'
import { CurrentWeatherResource } from '../../models/current_weather'
import { TimeContext } from '../../common/TimeContext'

const CurrentWeather = () => {
    const {
        longitude,
        latitude,
        isLoading: isLocationLoading,
    } = useContext(LocationContext)
    const { timeZone } = useContext(TimeContext)
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

    const isLoadingData = useMemo(
        () => isIconLoading || isWeatherLoading || isLocationLoading,
        [isIconLoading, isWeatherLoading, isLocationLoading]
    )

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
            />
        )
    }, [isLoadingData, iconError, icon])

    const weatherData = useMemo(() => {
        if (isLoadingData) {
            return (
                <React.Fragment>
                    <Skeleton variant="rounded" height={80} />
                    <Skeleton variant="rounded" />
                    <Skeleton variant="rounded" />
                </React.Fragment>
            )
        } else if (error || !weather) {
            return <React.Fragment>Error!</React.Fragment>
        }
        return getWeatherInfoElement(weather)
    }, [isLoadingData, error, weather])

    if ((!longitude || !latitude) && !isLocationLoading) {
        return (
            <ErrorCard
                Card={MediumCard}
                error={
                    'Longitude and or latitude are not set. Please update your location in the settings'
                }
                showSettingsBtn
            />
        )
    }

    return (
        <MediumCard>
            <Grid container spacing={1}>
                <Grid item xs={6}>
                    <Stack spacing={1}>{weatherData}</Stack>
                </Grid>
                <Grid item xs={6}>
                    {weatherIconJsx}
                </Grid>
            </Grid>
        </MediumCard>
    )
}

const getWeatherInfoElement = (
    weather: CurrentWeatherResource
): JSX.Element => {
    return (
        <React.Fragment>
            <Typography variant="h3">
                {weather.temperature.current.toFixed() ?? '-'}
                {TEMP_UNIT}
            </Typography>
            <Stack direction={'row'}>
                <ArrowDropUpIcon />
                <Typography variant="subtitle2" color="text.primary">
                    {weather.temperature.max.toFixed() ?? '-'}
                    {TEMP_UNIT}
                </Typography>
                <ArrowDropDownIcon />
                <Typography variant="subtitle2" color="text.primary">
                    {weather.temperature.min.toFixed() ?? '-'}
                    {TEMP_UNIT}
                </Typography>
            </Stack>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Feels like {weather.temperature.feels_like.toFixed() ?? '-'}
                {TEMP_UNIT}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={smallFontSize}
            >
                Precipitaiton:{' '}
                {(weather.precipitation_sum.toFixed(1) ??
                weather.precipitation_sum === 0)
                    ? weather.precipitation_sum
                    : '-'}{' '}
                {PRECIPITATION_UNIT}
            </Typography>
        </React.Fragment>
    )
}

export default CurrentWeather
