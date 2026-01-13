import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { TRAINS_API } from '../constants/api'
import { TrainStation, TrainConnection } from '../models/trains'

export const useSearchTrainStations = (
    query: string,
    enabled: boolean = true
): UseQueryResult<TrainStation[], Error> =>
    useQuery<TrainStation[], Error>({
        queryKey: [ServerStateKeysEnum.train_stations, query],
        queryFn: async (): Promise<TrainStation[]> =>
            fetchJson<TrainStation[]>(
                `${TRAINS_API}/stations?query=${encodeURIComponent(query)}&results=10`
            ),
        enabled: enabled && query.length >= 2,
        staleTime: 300000, // 5 minutes
    })

const DEFAULT_REFETCH_INTERVAL = 300000
const DEPARTURE_BUFFER = 15000
const MIN_REFETCH_INTERVAL = 15000

/**
 * Calculates the refetch interval based on the earliest train departure time.
 * Returns the time until the earliest departure (plus buffer) or the default interval,
 * whichever is smaller.
 */
const calculateRefetchInterval = (
    data: TrainConnection[] | undefined
): number => {
    if (!data || data.length === 0) {
        return DEFAULT_REFETCH_INTERVAL
    }

    const now = Date.now()

    const earliestDeparture = data.reduce((earliest, connection) => {
        const departureTime = new Date(connection.departure).getTime()
        return departureTime < earliest ? departureTime : earliest
    }, Infinity)

    if (earliestDeparture === Infinity) {
        return DEFAULT_REFETCH_INTERVAL
    }

    const timeUntilDeparture = earliestDeparture + DEPARTURE_BUFFER - now

    if (timeUntilDeparture <= 0) {
        return MIN_REFETCH_INTERVAL
    }

    return Math.min(timeUntilDeparture, DEFAULT_REFETCH_INTERVAL)
}

export const useGetTrainConnections = (
    fromStationId: string | undefined,
    toStationId: string | undefined,
    enabled: boolean = true
): UseQueryResult<TrainConnection[], Error> =>
    useQuery<TrainConnection[], Error>({
        queryKey: [
            ServerStateKeysEnum.train_connections,
            fromStationId,
            toStationId,
        ],
        queryFn: async (): Promise<TrainConnection[]> =>
            fetchJson<TrainConnection[]>(
                `${TRAINS_API}/connections?from=${encodeURIComponent(fromStationId!)}&to=${encodeURIComponent(toStationId!)}&results=2`
            ),
        enabled: enabled && !!fromStationId && !!toStationId,
        refetchInterval: (data) => calculateRefetchInterval(data),
        staleTime: 30000, // Consider data stale after 30 seconds
    })
