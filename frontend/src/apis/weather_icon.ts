import { useQuery } from 'react-query'
import { ServerStateKeysEnum } from '../common/statekeys'
import { WEATHER_ICON_ZOOM } from '../constants/weather'
import { runtimeConfig } from '../constants/runtimeConfig'

const OPENWEATHER_URL = runtimeConfig.weatherIconBaseUrl

// Open-Meteo/OpenWeatherMap icon URLs are keyless and public, so this is just
// a direct image URL rather than a fetched-and-cached Blob.
export const useGetWeatherIcon = (
    weather_icon: string,
    icon_zoom: string = WEATHER_ICON_ZOOM,
    enabled: boolean = true
) =>
    useQuery<string, Error>({
        queryKey: [ServerStateKeysEnum.weather_icon, weather_icon, icon_zoom],
        enabled,
        queryFn: async () =>
            `${OPENWEATHER_URL}/img/wn/${weather_icon}@${icon_zoom}.png`,
    })
