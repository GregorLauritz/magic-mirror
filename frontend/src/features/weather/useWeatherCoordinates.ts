// Transitional bridge (removed in step S4): adapts the legacy LocationContext,
// whose (0, 0) value doubles as "unknown", to an explicit state. S4 replaces it
// with a hook that resolves the coordinates through the application layer.
// eslint-disable-next-line import/no-restricted-paths -- transitional bridge to legacy code
import { useLocation } from '../../hooks/useLocation'
import type { CoordinatesState } from './CoordinatesState'

export const useWeatherCoordinates = (): CoordinatesState => {
    const { latitude, longitude, isLoading } = useLocation()
    if (isLoading) return { status: 'loading' }
    if (!latitude || !longitude) return { status: 'not-configured' }
    return { status: 'ready', coordinates: { latitude, longitude } }
}
