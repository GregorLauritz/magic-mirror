import type { ComponentProps, ReactNode } from 'react'
import type { Coordinates } from '@/domain/location/Coordinates'
import ErrorCard from '@/shared/ui/ErrorCard'
import { useWeatherCoordinates } from './useWeatherCoordinates'

const NOT_SET_MESSAGE =
    'Longitude and or latitude are not set. Please update your location in the settings'

interface CoordinatesGateProps {
    /** Card used for the "no location" message, so the layout stays the same. */
    readonly Card: ComponentProps<typeof ErrorCard>['Card']
    readonly loading: ReactNode
    readonly children: (coordinates: Coordinates) => ReactNode
}

/**
 * Renders the widget only once there is a location to ask the weather for, so
 * the widget itself never sees "unknown coordinates".
 */
export const CoordinatesGate = ({
    Card,
    loading,
    children,
}: CoordinatesGateProps) => {
    const state = useWeatherCoordinates()

    switch (state.status) {
        case 'loading':
            return <>{loading}</>
        case 'ready':
            return <>{children(state.coordinates)}</>
        case 'not-configured':
            return (
                <ErrorCard
                    Card={Card}
                    error={NOT_SET_MESSAGE}
                    showSettingsBtn
                />
            )
    }
}
