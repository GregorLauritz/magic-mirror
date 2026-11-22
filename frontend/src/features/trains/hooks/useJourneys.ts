import { useQuery } from 'react-query'
import { useServices } from '@/app/services/useServices'
import { nextPollDelayMs, POLL_NEAR_MS } from '@/domain/trains/pollingPolicy'
import type { Journey } from '@/domain/trains/types'
import { JOURNEY_LIMIT } from '../constants'
import { trainKeys } from '../trainKeys'

export interface JourneysState {
    /** The next journeys, or undefined until a load succeeded. */
    readonly journeys: readonly Journey[] | undefined
    readonly isLoading: boolean
    readonly isError: boolean
}

/**
 * The next journeys between two stations. Polling speeds up as the first
 * departure nears (see pollingPolicy), and nothing is asked until both
 * stations are chosen.
 */
export const useJourneys = (
    fromId: string | undefined,
    toId: string | undefined
): JourneysState => {
    const { trains, clock } = useServices()
    const from = fromId ?? ''
    const to = toId ?? ''

    const query = useQuery<readonly Journey[], Error>(
        trainKeys.journeys(from, to),
        ({ signal }) =>
            trains.getJourneys(
                { fromId: from, toId: to, limit: JOURNEY_LIMIT },
                signal
            ),
        {
            enabled: from !== '' && to !== '',
            refetchInterval: (data) => nextPollDelayMs(data ?? [], clock.now()),
            staleTime: POLL_NEAR_MS,
        }
    )

    return {
        journeys: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}
