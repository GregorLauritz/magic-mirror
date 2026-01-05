import ForecastItem from './ForecastItem'
import { useGetDailyWeather } from '../../apis/daily_weather'
import { MediumCard } from '../CardFrame'
import { Grid } from '@mui/material'
import React, { useMemo } from 'react'
import { useTimeContext } from '../../hooks/useTimeContext'
import { useLocation } from '../../hooks/useLocation'
import ErrorCard from '../error_card/ErrorCard'
import { DAILY_FORECAST_DAYS } from '../../constants/weather'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

const DailyForecast = () => {
    const { addDailyUpdateTrigger, timeZone } = useTimeContext()
    const {
        longitude,
        latitude,
        isLoading: isLocationLoading,
    } = useLocation()

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

    const isLoadingData = useMemo(
        () => isWeatherLoading || isLocationLoading,
        [isWeatherLoading, isLocationLoading]
    )

    const forecastItems = useMemo(() => {
        if (isLoadingData) {
            return Array.from({ length: DAILY_FORECAST_DAYS }, (_, i) => (
                <Grid item xs={3} key={i}>
                    <ForecastItem item={undefined} isLoading={true} />
                </Grid>
            ))
        } else if (weather?.forecast) {
            return weather.forecast.map((val) => (
                <Grid item xs={3} key={val.date}>
                    <ForecastItem item={val} isLoading={false} />
                </Grid>
            ))
        } else {
            return <React.Fragment>Error!</React.Fragment>
        }
    }, [weather?.forecast, isLoadingData])

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

export default DailyForecast
