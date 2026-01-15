import ForecastItem from './ForecastItem'
import { useGetDailyWeather } from '../../apis/daily_weather'
import { MediumCard } from '../CardFrame'
import { Grid, Typography } from '@mui/material'
import { memo, useMemo } from 'react'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useLocation } from '../../hooks/useLocation'
import ErrorCard from '../error_card/ErrorCard'
import { DAILY_FORECAST_DAYS } from '../../constants/weather'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

const DailyForecastComponent = () => {
    const { addDailyUpdateTrigger, timeZone } = useTimeContext()
    const { longitude, latitude, isLoading: isLocationLoading } = useLocation()

    const {
        data: weather,
        isLoading: isWeatherLoading,
        refetch,
    } = useGetDailyWeather(
        longitude,
        latitude,
        DAILY_FORECAST_DAYS,
        !isLocationLoading,
        timeZone
    )

    useRegisterUpdateTrigger(addDailyUpdateTrigger, refetch)

    const isLoadingData = isWeatherLoading || isLocationLoading

    const forecastItems = useMemo(() => {
        if (isLoadingData) {
            return Array.from({ length: DAILY_FORECAST_DAYS }, (_, i) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
                    <ForecastItem item={undefined} isLoading={true} />
                </Grid>
            ))
        }

        if (weather?.forecast) {
            return weather.forecast.map((val) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={val.date}>
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
            <Grid container spacing={1}>
                {forecastItems}
            </Grid>
        </MediumCard>
    )
}

const DailyForecast = memo(DailyForecastComponent)
DailyForecast.displayName = 'DailyForecast'

export default DailyForecast
