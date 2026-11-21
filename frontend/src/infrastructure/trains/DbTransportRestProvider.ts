import type { HttpClient } from '@/application/ports/HttpClient'
import type {
    JourneyQuery,
    TrainProvider,
} from '@/application/ports/TrainProvider'
import type { Journey, Station } from '@/domain/trains/types'
import { mapJourneys, mapStations } from './dbTransportMapper'

/** Deutsche Bahn's public db.transport.rest API (keyless). */
export class DbTransportRestProvider implements TrainProvider {
    constructor(
        private readonly http: HttpClient,
        private readonly baseUrl: string
    ) {}

    async searchStations(
        query: string,
        limit: number,
        signal?: AbortSignal
    ): Promise<readonly Station[]> {
        const params = new URLSearchParams({
            query,
            results: String(limit),
            poi: 'false',
            addresses: 'false',
        })
        const url = `${this.baseUrl}/locations?${params}`
        return mapStations(await this.http.getJson({ url, signal }))
    }

    async getJourneys(
        { fromId, toId, limit }: JourneyQuery,
        signal?: AbortSignal
    ): Promise<readonly Journey[]> {
        const params = new URLSearchParams({
            from: fromId,
            to: toId,
            results: String(limit),
        })
        const url = `${this.baseUrl}/journeys?${params}`
        return mapJourneys(await this.http.getJson({ url, signal }))
    }
}
