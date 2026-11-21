import type {
    JourneyQuery,
    TrainProvider,
} from '@/application/ports/TrainProvider'
import type { Journey, Station } from '@/domain/trains/types'

interface Script {
    journeys?: readonly Journey[] | Error
    stations?: readonly Station[] | Error
}

/** Scripted TrainProvider that records its calls. */
export class FakeTrainProvider implements TrainProvider {
    readonly journeyCalls: JourneyQuery[] = []
    readonly stationCalls: Array<{ query: string; limit: number }> = []
    /** The abort signal of every call, in order. */
    readonly signals: Array<AbortSignal | undefined> = []

    constructor(public script: Script = {}) {}

    async searchStations(
        query: string,
        limit: number,
        signal?: AbortSignal
    ): Promise<readonly Station[]> {
        this.stationCalls.push({ query, limit })
        this.signals.push(signal)
        return this.answer(this.script.stations, 'stations')
    }

    async getJourneys(
        query: JourneyQuery,
        signal?: AbortSignal
    ): Promise<readonly Journey[]> {
        this.journeyCalls.push(query)
        this.signals.push(signal)
        return this.answer(this.script.journeys, 'journeys')
    }

    private answer<T>(value: T | Error | undefined, what: string): T {
        if (value === undefined) throw new Error(`Unscripted ${what} call`)
        if (value instanceof Error) throw value
        return value
    }
}
