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

const REFETCH_INTERVAL_FAR = 300000 // 5 minutes
const REFETCH_INTERVAL_NEAR = 60000 // 1 minute
const NEAR_DEPARTURE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes in milliseconds

export const getRefetchInterval = (data: TrainConnection[] | undefined): number => {
    if (!data || data.length === 0) {
        return REFETCH_INTERVAL_FAR
    }

    const now = Date.now()

    const nextConnection = data.reduce((min, connection) =>
        new Date(connection.departure).getTime() + (connection.delay ?? 0) * 60 * 1000 <
        new Date(min.departure).getTime() + (min.delay ?? 0) * 60 * 1000
            ? connection
            : min
    )

    const actualDepartureTime =
        new Date(nextConnection.departure).getTime() +
        (nextConnection.delay ?? 0) * 60 * 1000

    if (actualDepartureTime - now > NEAR_DEPARTURE_THRESHOLD_MS) {
        return REFETCH_INTERVAL_FAR
    }

    return REFETCH_INTERVAL_NEAR
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
        refetchInterval: (data) => getRefetchInterval(data),
        staleTime: REFETCH_INTERVAL_NEAR,
    })
