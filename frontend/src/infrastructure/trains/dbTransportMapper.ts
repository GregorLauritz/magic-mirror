import { ProviderResponseError } from '@/application/ports/errors'
import { instant, type Instant } from '@/domain/shared/time'
import type { Journey, JourneyLeg, Station } from '@/domain/trains/types'

// Maps db.transport.rest v6 (hafas-client) responses to domain objects.
// `departure`/`arrival` are real-time moments and already contain the delay;
// `plannedDeparture`/`plannedArrival` are the timetable; `departureDelay` is in
// seconds. An entry that cannot be understood is dropped instead of failing
// the whole list; only a response that is not a list at all is an error.

type Json = Readonly<Record<string, unknown>>

const MINUTE_MS = 60_000

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const instantOf = (value: unknown): Instant | undefined => {
    if (typeof value !== 'string') return undefined
    const epochMs = Date.parse(value)
    return Number.isNaN(epochMs) ? undefined : instant(epochMs)
}

const nonEmptyText = (value: unknown): string | undefined =>
    typeof value === 'string' && value !== '' ? value : undefined

export const mapStations = (payload: unknown): Station[] => {
    if (!Array.isArray(payload)) {
        throw new ProviderResponseError(
            'Train stations: the response is not a list'
        )
    }
    return payload.flatMap((entry: unknown) => {
        if (!isRecord(entry)) return []
        if (entry.type !== 'station' && entry.type !== 'stop') return []
        const id = nonEmptyText(entry.id)
        const name = nonEmptyText(entry.name)
        return id !== undefined && name !== undefined ? [{ id, name }] : []
    })
}

const legOf = (leg: Json): JourneyLeg => ({
    line: isRecord(leg.line) ? nonEmptyText(leg.line.name) : undefined,
    walking: leg.walking === true,
    cancelled: leg.cancelled === true,
})

const journeyOf = (raw: Json): Journey | undefined => {
    if (!Array.isArray(raw.legs)) return undefined
    const legs = raw.legs.filter(isRecord)
    if (legs.length === 0) return undefined

    const first = legs[0]
    const last = legs[legs.length - 1]
    const departure =
        instantOf(first.departure) ?? instantOf(first.plannedDeparture)
    const arrival = instantOf(last.arrival) ?? instantOf(last.plannedArrival)
    if (departure === undefined || arrival === undefined) return undefined

    return {
        departure,
        arrival,
        delaySeconds:
            typeof first.departureDelay === 'number' &&
            Number.isFinite(first.departureDelay)
                ? first.departureDelay
                : 0,
        durationMinutes: Math.max(
            0,
            Math.floor((arrival - departure) / MINUTE_MS)
        ),
        departurePlatform: nonEmptyText(first.departurePlatform),
        legs: legs.map(legOf),
    }
}

export const mapJourneys = (payload: unknown): Journey[] => {
    if (!isRecord(payload)) {
        throw new ProviderResponseError(
            'Train journeys: the response is not an object'
        )
    }
    if (payload.journeys === undefined || payload.journeys === null) return []
    if (!Array.isArray(payload.journeys)) {
        throw new ProviderResponseError(
            'Train journeys: "journeys" is not a list'
        )
    }
    return payload.journeys.flatMap((raw: unknown) => {
        const journey = isRecord(raw) ? journeyOf(raw) : undefined
        return journey === undefined ? [] : [journey]
    })
}
