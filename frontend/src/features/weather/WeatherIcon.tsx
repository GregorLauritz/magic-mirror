import { Box } from '@mui/material'
import type { WeatherCondition } from '@/domain/weather/WeatherCondition'
import { CARD_HEIGHT } from '@/shared/styles/cards'
import { useWeatherIcon } from './useWeatherIcon'

/** The icon used in the forecast columns. */
export const WeatherIcon = ({ condition }: { condition: WeatherCondition }) => {
    const { src, alt } = useWeatherIcon(condition)
    return (
        <Box
            component="img"
            src={src}
            alt={alt}
            loading="lazy"
            sx={{
                maxWidth: '100%',
                maxHeight: CARD_HEIGHT / 2.3,
                height: 'auto',
                objectFit: 'contain',
            }}
        />
    )
}
