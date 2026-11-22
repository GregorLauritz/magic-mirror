import unknownWeatherIcon from '@/assets/unknown-weather.svg'
import { useServices } from '@/app/services/useServices'
import type { WeatherCondition } from '@/domain/weather/WeatherCondition'
import { describeCondition, weatherIconUrl } from './weatherPresentation'

/** Image source and accessible label for a condition. */
export const useWeatherIcon = (condition: WeatherCondition) => {
    const { config } = useServices()
    return {
        src: weatherIconUrl(condition, config) ?? unknownWeatherIcon,
        alt: describeCondition(condition.kind),
    }
}
