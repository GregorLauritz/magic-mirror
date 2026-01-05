import { createContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useGetUserSettings } from '../apis/user_settings'
import { useGetGeocode } from '../apis/geocode'
import { QueryParameters } from '../models/apis'
import { GeoLocation } from '../models/location'

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

const LocationContextProvider = ({ children }: LocationContextProviderProps) => {
    const { data: userSettings, isLoading: isUserSettingLoading } =
        useGetUserSettings(false)
    const [queryParameters, setQueryParameters] = useState<QueryParameters>([])
    const [geoLocation, setGeoLocation] = useState<GeoLocation>({
        longitude: 0,
        latitude: 0,
    })
    const loadGeocode = useMemo(
        () => !isUserSettingLoading && queryParameters.length > 0,
        [isUserSettingLoading, queryParameters]
    )
    const { data: apiGeoLocation, isLoading: isGeoCodeLoading } = useGetGeocode(
        queryParameters,
        loadGeocode
    )

    useEffect(() => {
        if (
            isUserSettingLoading ||
            !userSettings?.city ||
            !userSettings?.country ||
            !userSettings?.zip_code
        )
            return
        setQueryParameters([
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
        ])
    }, [
        userSettings?.city,
        userSettings?.country,
        userSettings?.zip_code,
        isUserSettingLoading,
    ])

    useEffect(() => {
        if (apiGeoLocation && !isGeoCodeLoading) {
            setGeoLocation(apiGeoLocation)
        }
    }, [apiGeoLocation, isGeoCodeLoading])

    const contextValue = useMemo<LocationContextType>(
        () => ({
            ...geoLocation,
            isLoading: isUserSettingLoading || isGeoCodeLoading,
        }),
        [geoLocation, isUserSettingLoading, isGeoCodeLoading]
    )

    return (
        <LocationContext.Provider value={contextValue}>
            {children}
        </LocationContext.Provider>
    )
}

export { LocationContext, LocationContextProvider }
