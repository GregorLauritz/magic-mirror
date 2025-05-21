import ForecastItem from './ForecastItem'
import { useGetHourlyWeather } from '../../apis/hourly_weather'
import { MediumCard } from '../CardFrame'
import { Grid } from '@mui/material'
import React, { useContext, useEffect, useMemo } from 'react'
import { TimeContext } from '../../common/TimeContext'
import { LocationContext } from '../../common/LocationContext'
import ErrorCard from '../error_card/ErrorCard'
import { HOURLY_FORECAST_HOURS } from '../../constants/weather'

const HourlyWeather = () => {
    const {
        longitude,
        latitude,
        isLoading: isLocationLoading,
    } = useContext(LocationContext)
    const { addHourlyUpdateTrigger, timeZone } = useContext(TimeContext)
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

    useEffect(() => {
        addHourlyUpdateTrigger(refetch)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const forecastItems = useMemo(() => {
        if (isWeatherLoading || isLocationLoading) {
            return Array.from({ length: HOURLY_FORECAST_HOURS }, (_, i) => (
                <ForecastItem item={undefined} key={i} isLoading={true} />
            ))
        } else if (weather?.forecast) {
            return weather.forecast.map((val) => (
                <Grid item xs={2} key={JSON.stringify(val)}>
                    <ForecastItem item={val} key={val.time} isLoading={false} />
                </Grid>
            ))
        } else {
            return <React.Fragment>Error!</React.Fragment>
        }
    }, [isWeatherLoading, isLocationLoading, weather?.forecast])

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
            <Grid container spacing={1} columns={10}>
                {forecastItems}
            </Grid>
        </MediumCard>
    )
}

export default HourlyWeather
