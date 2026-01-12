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

export const useGetTrainConnections = (
    fromStationId: string | undefined,
    toStationId: string | undefined,
    enabled: boolean = true
): UseQueryResult<TrainConnection[], Error> =>
    useQuery<TrainConnection[], Error>({
        queryKey: [ServerStateKeysEnum.train_connections, fromStationId, toStationId],
        queryFn: async (): Promise<TrainConnection[]> =>
            fetchJson<TrainConnection[]>(
                `${TRAINS_API}/connections?from=${encodeURIComponent(fromStationId!)}&to=${encodeURIComponent(toStationId!)}&results=5`
            ),
        enabled: enabled && !!fromStationId && !!toStationId,
        refetchInterval: 60000, // Refetch every minute
        staleTime: 30000, // Consider data stale after 30 seconds
    })
