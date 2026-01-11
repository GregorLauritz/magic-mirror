import { createContext, useMemo, type ReactNode, memo } from 'react'
import { useGetUserSettings } from '../apis/user_settings'
import { useGetGeocode } from '../apis/geocode'
import { QUERY_PARAM } from '../models/apis'

type LocationContextType = {
    longitude: number
    latitude: number
    isLoading: boolean
}

const defaultValue: LocationContextType = {
    longitude: 0,
    latitude: 0,
    isLoading: true,
}

const LocationContext = createContext<LocationContextType>(defaultValue)

interface LocationContextProviderProps {
    children: ReactNode
}

const LocationContextProviderComponent = ({
    children,
}: LocationContextProviderProps) => {
    const { data: userSettings, isLoading: isUserSettingLoading } =
        useGetUserSettings(false)

    const queryParameters = useMemo<QUERY_PARAM[]>(() => {
        if (
            isUserSettingLoading ||
            !userSettings?.city ||
            !userSettings?.country ||
            !userSettings?.zip_code
        ) {
            return []
        }
        return [
            {
                name: 'city',
                value: userSettings.city,
            },
            {
                name: 'country',
                value: userSettings.country,
            },
            {
                name: 'zip_code',
                value: userSettings.zip_code,
            },
        ]
    }, [userSettings, isUserSettingLoading])

    console.log('Location query parameters:', queryParameters)

    const { data: apiGeoLocation, isLoading: isGeoCodeLoading } = useGetGeocode(
        queryParameters,
        queryParameters.length > 0
    )

    console.log('Geocode API location data:', apiGeoLocation)

    const contextValue = useMemo<LocationContextType>(
        () => ({
            longitude: apiGeoLocation?.longitude ?? 0,
            latitude: apiGeoLocation?.latitude ?? 0,
            isLoading: isUserSettingLoading || isGeoCodeLoading,
        }),
        [
            apiGeoLocation?.longitude,
            apiGeoLocation?.latitude,
            isUserSettingLoading,
            isGeoCodeLoading,
        ]
    )

    return (
        <LocationContext.Provider value={contextValue}>
            {children}
        </LocationContext.Provider>
    )
}

const LocationContextProvider = memo(LocationContextProviderComponent)
LocationContextProvider.displayName = 'LocationContextProvider'

export { LocationContext, LocationContextProvider }
export type { LocationContextType }
