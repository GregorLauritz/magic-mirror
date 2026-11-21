import { useQuery } from 'react-query'
import { useServices } from '@/app/services/useServices'
import type { Station } from '@/domain/trains/types'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import {
    MIN_STATION_QUERY_LENGTH,
    STATION_RESULTS,
    STATION_SEARCH_DEBOUNCE_MS,
    STATION_STALE_MS,
} from '../constants'
import { trainKeys } from '../trainKeys'

const NONE: readonly Station[] = []

export interface StationSearchState {
    /** Empty while the text is too short or nothing was found yet. */
    readonly stations: readonly Station[]
    readonly isLoading: boolean
    readonly isError: boolean
}

/** Stations matching what is being typed, asked for once the typing pauses. */
export const useStationSearch = (text: string): StationSearchState => {
    const { trains } = useServices()
    const query = useDebouncedValue(text.trim(), STATION_SEARCH_DEBOUNCE_MS)
    const enabled = query.length >= MIN_STATION_QUERY_LENGTH

    const result = useQuery<readonly Station[], Error>(
        trainKeys.stations(query),
        ({ signal }) => trains.searchStations(query, STATION_RESULTS, signal),
        { enabled, staleTime: STATION_STALE_MS }
    )

    return {
        stations: enabled ? (result.data ?? NONE) : NONE,
        isLoading: enabled && result.isLoading,
        isError: enabled && result.isError,
    }
}
