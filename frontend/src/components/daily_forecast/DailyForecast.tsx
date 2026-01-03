import ForecastItem from './ForecastItem'
import { useGetDailyWeather } from '../../apis/daily_weather'
import { MediumCard } from '../CardFrame'
import { Grid } from '@mui/material'
import React, { useContext, useEffect, useMemo } from 'react'
import { TimeContext } from '../../common/TimeContext'
import { LocationContext } from '../../common/LocationContext'
import ErrorCard from '../error_card/ErrorCard'
import { DAILY_FORECAST_DAYS } from '../../constants/weather'

const DailyForecast = () => {
    const { addDailyUpdateTrigger, timeZone } = useContext(TimeContext)
    const {
        longitude,
        latitude,
        isLoading: isLocationLoading,
    } = useContext(LocationContext)

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

    // Register refetch trigger only once on mount, not when refetch changes
    // This prevents re-registering the same trigger on every render
    useEffect(() => {
        addDailyUpdateTrigger(refetch)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isLoadingData = useMemo(
        () => isWeatherLoading || isLocationLoading,
        [isWeatherLoading, isLocationLoading]
    )

    const forecastItems = useMemo(() => {
        if (isLoadingData) {
            return Array.from({ length: DAILY_FORECAST_DAYS }, (_, i) => (
                <ForecastItem item={undefined} key={`skeleton-${i}`} isLoading={true} />
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
                {forecastItems}
            </Grid>
        </MediumCard>
    )
}

export default DailyForecast
