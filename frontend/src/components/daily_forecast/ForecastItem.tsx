import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { TEMP_UNIT } from '../../constants/weather'
import unknownWeatherIcon from '../../assets/unknown-weather.svg'
import { WeatherForecastResource } from '../../models/daily_forecast'
import { smallFontSize } from '../../assets/styles/theme'
import { useGetWeatherIcon } from '../../apis/weather_icon'
import { useGetDayName } from '../../apis/day_name'
import { useMemo } from 'react'
import { CARD_HEIGHT } from '../../assets/styles/cards'

interface IForecastItem {
    item: WeatherForecastResource | undefined
    isLoading: boolean
}

const ForecastItem = ({ item, isLoading }: IForecastItem) => {
    const date = useMemo(() => new Date(item?.date ?? 0), [item?.date])
    const { data: dayName } = useGetDayName(date)

    const {
        data: icon,
        isLoading: iconLoading,
        error: iconError,
    } = useGetWeatherIcon(
        item?.weather_icon ?? '',
        '4x',
        !isLoading && item?.weather_icon !== undefined
    )

    if (isLoading || iconLoading || !item) {
        return (
            <Stack direction={'column'} spacing={1}>
                <Skeleton key={`skeleton-0`} variant="rounded" />
                <Skeleton key={`skeleton-1`} variant="rounded" height={50} />
                <Skeleton key={`skeleton-2`} variant="rounded" />
                <Skeleton key={`skeleton-3`} variant="rounded" />
            </Stack>
        )
    }

    return (
        <Stack direction={'column'} spacing={0.5} alignItems={'center'}>
            <Typography variant="subtitle2" color="text.primary" align="center">
                {dayName}
            </Typography>
            <Box
                component="img"
                src={iconError || !icon ? unknownWeatherIcon : icon}
                alt="Weather Icon"
                loading="lazy"
                sx={{
                    maxWidth: '100%',
                    maxHeight: CARD_HEIGHT / 2.3,
                    height: 'auto',
                    objectFit: 'contain',
                }}
            />
            <Stack direction={'row'} justifyContent={'center'}>
                <Typography
                    variant="subtitle2"
                    color="text.primary"
                    fontWeight={'bold'}
                    fontSize={smallFontSize}
                >
                    {Math.round(item.temperature.max).toString() ?? '-'}
                    {TEMP_UNIT}
                </Typography>
                &nbsp;
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={smallFontSize}
                >
                    {Math.round(item.temperature.min).toString() ?? '-'}
                    {TEMP_UNIT}
                </Typography>
            </Stack>
            <Typography
                variant="subtitle2"
                color="text.primary"
                align="center"
                sx={smallFontSize}
            >
                {item.precipitation.amount} {item.precipitation.amount_unit}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.primary"
                align="center"
                sx={smallFontSize}
            >
                {item.max_wind_speed.value} {item.max_wind_speed.unit}
            </Typography>
        </Stack>
    )
}

export default ForecastItem
