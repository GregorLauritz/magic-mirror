import type { Journey, Station } from '@/domain/trains/types'

export interface JourneyQuery {
    readonly fromId: string
    readonly toId: string
    readonly limit: number
}

/** Train stations and the journeys between them. */
export interface TrainProvider {
    searchStations(
        query: string,
        limit: number,
        signal?: AbortSignal
    ): Promise<readonly Station[]>
    /** The next journeys, soonest first. */
    getJourneys(
        query: JourneyQuery,
        signal?: AbortSignal
    ): Promise<readonly Journey[]>
}
