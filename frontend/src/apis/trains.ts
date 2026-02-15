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
        refetchInterval: DEFAULT_REFETCH_INTERVAL,
        staleTime: DEFAULT_REFETCH_INTERVAL,
    })
