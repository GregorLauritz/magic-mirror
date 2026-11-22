import type { ComponentProps, ReactNode } from 'react'
import type { Coordinates } from '@/domain/location/Coordinates'
import ErrorCard from '@/shared/ui/ErrorCard'
import type { CoordinatesState } from './CoordinatesState'
import { useCoordinates } from './useCoordinates'

type Problem = Exclude<CoordinatesState, { status: 'loading' | 'ready' }>

const NOT_SET =
    'Longitude and or latitude are not set. Please update your location in the settings'

const messageFor = (problem: Problem): string => {
    if (problem.status === 'not-configured') {
        return problem.reason === 'no-api-key'
            ? 'No Geocode Maps API key is set. Please add it in the settings'
            : NOT_SET
    }
    switch (problem.reason) {
        case 'not-found':
            return 'The location could not be found. Please check the address in the settings'
        case 'unauthorized':
            return 'The Geocode Maps API key was rejected. Please check it in the settings'
        case 'network':
            return 'The location could not be looked up right now. It will be retried automatically'
        case 'invalid-response':
            return 'The location lookup returned an unexpected answer'
    }
}

// Problems the user can fix in the settings; the others fix themselves.
const fixableInSettings = (problem: Problem): boolean =>
    problem.status === 'not-configured' ||
    problem.reason === 'not-found' ||
    problem.reason === 'unauthorized'

interface CoordinatesGateProps {
    /** Card used for the problem message, so the layout stays the same. */
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
    const state = useCoordinates()

    if (state.status === 'loading') return <>{loading}</>
    if (state.status === 'ready') return <>{children(state.coordinates)}</>
    return (
        <ErrorCard
            Card={Card}
            error={messageFor(state)}
            showSettingsBtn={fixableInSettings(state)}
        />
    )
}
