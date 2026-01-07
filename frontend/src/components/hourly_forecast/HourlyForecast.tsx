import ForecastItem from './ForecastItem'
import { useGetHourlyWeather } from '../../apis/hourly_weather'
import { MediumCard } from '../CardFrame'
import { Grid, Typography } from '@mui/material'
import { memo, useMemo } from 'react'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useLocation } from '../../hooks/useLocation'
import ErrorCard from '../error_card/ErrorCard'
import { HOURLY_FORECAST_HOURS } from '../../constants/weather'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

const HourlyWeatherComponent = () => {
    const { longitude, latitude, isLoading: isLocationLoading } = useLocation()
    const { addHourlyUpdateTrigger, timeZone } = useTimeContext()

    const {
        data: weather,
        isLoading: isWeatherLoading,
        refetch,
    } = useGetHourlyWeather(
        longitude,
        latitude,
        HOURLY_FORECAST_HOURS,
        !isLocationLoading,
        timeZone
    )

    useRegisterUpdateTrigger(addHourlyUpdateTrigger, refetch)

    const isLoadingData = isWeatherLoading || isLocationLoading

    const forecastItems = useMemo(() => {
        if (isLoadingData) {
            return Array.from({ length: HOURLY_FORECAST_HOURS }, (_, i) => (
                <Grid size={2} key={i}>
                    <ForecastItem item={undefined} isLoading={true} />
                </Grid>
            ))
        }

        if (weather?.forecast) {
            return weather.forecast.map((val) => (
                <Grid size={2} key={val.time}>
                    <ForecastItem item={val} isLoading={false} />
                </Grid>
            ))
        }

        return (
            <Typography color="text.secondary">
                Error loading forecast
            </Typography>
        )
    }, [weather, isLoadingData])

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
            <Grid container spacing={1} columns={10}>
                {forecastItems}
            </Grid>
        </MediumCard>
    )
}

const HourlyWeather = memo(HourlyWeatherComponent)
HourlyWeather.displayName = 'HourlyWeather'

export default HourlyWeather
