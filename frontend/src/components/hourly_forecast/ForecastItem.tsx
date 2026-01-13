import { Box, Skeleton, Stack, Typography } from '@mui/material'
import {
    PRECIPITATION_UNIT,
    TEMP_UNIT,
    WINDSPEED_UNIT,
} from '../../constants/weather'
import unknownWeatherIcon from '../../assets/unknown-weather.svg'
import { HourlyWeatherResource } from '../../models/hourly_forecast'
import { parseTime } from '../../common/timeParser'
import { smallFontSize } from '../../assets/styles/theme'
import { useGetWeatherIcon } from '../../apis/weather_icon'
import { CARD_HEIGHT } from '../../assets/styles/cards'

interface IForecastItem {
    item?: HourlyWeatherResource
    isLoading: boolean
}

const ForecastItem = ({ item, isLoading }: IForecastItem) => {
    const {
        data: icon,
        isLoading: iconLoading,
        error: iconError,
    } = useGetWeatherIcon(
        item?.weather_icon ?? '',
        '4x',
        item?.weather_icon !== undefined && !isLoading
    )

    if (isLoading || iconLoading || !item) {
        return (
            <Stack direction={'column'} spacing={1}>
                <Skeleton key={`skeleton-0`} variant="rounded" />
                <Skeleton key={`skeleton-1`} variant="rounded" height={40} />
                <Skeleton key={`skeleton-2`} variant="rounded" />
                <Skeleton key={`skeleton-3`} variant="rounded" />
                <Skeleton key={`skeleton-4`} variant="rounded" />
            </Stack>
        )
    }

    return (
        <Stack direction={'column'} spacing={0.5} alignItems={'center'}>
            <Typography variant="subtitle2" color="text.primary" align="center">
                {parseTime(new Date(item.time).getHours())}:
                {parseTime(new Date(item.time).getMinutes())}
            </Typography>
            <Box
                component="img"
                src={iconError || iconLoading ? unknownWeatherIcon : icon}
                alt="Weather Icon"
                loading="lazy"
                sx={{
                    maxWidth: '100%',
                    maxHeight: CARD_HEIGHT / 2.3,
                    height: 'auto',
                    objectFit: 'contain',
                }}
            />
            <Typography
                variant="subtitle2"
                color="text.primary"
                align="center"
                sx={smallFontSize}
            >
                {Math.round(item.temperature)}
                {TEMP_UNIT}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.primary"
                align="center"
                sx={smallFontSize}
            >
                {item.precipitation} {PRECIPITATION_UNIT}
            </Typography>
            <Typography
                variant="subtitle2"
                color="text.primary"
                align="center"
                sx={smallFontSize}
            >
                {item.windspeed} {WINDSPEED_UNIT}
            </Typography>
        </Stack>
    )
}

export default ForecastItem
