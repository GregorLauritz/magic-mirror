import { describe, expect, it } from 'vitest'
import { ProviderResponseError } from '@/application/ports/errors'
import { instant } from '@/domain/shared/time'
import {
    mapJourneys,
    mapStations,
} from '@/infrastructure/trains/dbTransportMapper'
import {
    delayedDirectJourney,
    multiLegJourney,
    stationsResponse,
} from '../../fixtures/dbTransportRest'

const at = (iso: string) => instant(Date.parse(iso))

describe('mapStations', () => {
    it('keeps stations and stops with an id and a name', () => {
        expect(mapStations(stationsResponse)).toEqual([
            { id: '8000096', name: 'Stuttgart Hbf' },
            { id: '8000105', name: 'Frankfurt(Main)Hbf' },
        ])
    })

    it('answers an empty result with an empty list', () => {
        expect(mapStations([])).toEqual([])
    })

    it.each([null, 'text', 42, {}, { journeys: [] }])(
        'rejects the malformed response %j',
        (payload) => {
            expect(() => mapStations(payload)).toThrow(ProviderResponseError)
        }
    )
})

describe('mapJourneys', () => {
    it('maps a delayed direct journey: actual times as they are, the delay in seconds', () => {
        const [journey] = mapJourneys({ journeys: [delayedDirectJourney] })

        expect(journey).toEqual({
            // 10:05+01:00 is the REAL departure; it is not shifted by the delay again (B1)
            departure: at('2024-01-15T09:05:00Z'),
            arrival: at('2024-01-15T10:52:00Z'),
            delaySeconds: 300,
            durationMinutes: 107,
            departurePlatform: '9',
            legs: [{ line: 'ICE 599', walking: false, cancelled: false }],
        })
    })

    it('uses the timetable when there is no real-time data, with no delay', () => {
        const raw = structuredClone(delayedDirectJourney)
        Object.assign(raw.legs[0], {
            departure: null,
            arrival: null,
            departureDelay: null,
            arrivalDelay: null,
        })

        const [journey] = mapJourneys({ journeys: [raw] })

        expect(journey.departure).toBe(at('2024-01-15T09:00:00Z')) // plannedDeparture
        expect(journey.arrival).toBe(at('2024-01-15T10:47:00Z')) // plannedArrival
        expect(journey.delaySeconds).toBe(0)
    })

    it('takes departure, arrival and duration from the first and last leg', () => {
        const journey = mapJourneys({ journeys: [multiLegJourney] })[0]

        expect(journey.departure).toBe(at('2024-01-15T08:50:00Z'))
        expect(journey.arrival).toBe(at('2024-01-15T11:20:00Z'))
        expect(journey.durationMinutes).toBe(150)
    })

    it('marks walking and cancelled legs and keeps the line names', () => {
        const journey = mapJourneys({ journeys: [multiLegJourney] })[0]

        expect(journey.legs).toEqual([
            { line: undefined, walking: true, cancelled: false },
            { line: 'RE 5', walking: false, cancelled: true },
            { line: 'ICE 71', walking: false, cancelled: false },
        ])
    })

    it('has no platform when the first leg is a walk', () => {
        const journey = mapJourneys({ journeys: [multiLegJourney] })[0]

        expect(journey.departurePlatform).toBeUndefined()
    })

    it('treats a delay that is not a number as no delay', () => {
        const raw = structuredClone(delayedDirectJourney)
        ;(raw.legs[0] as { departureDelay: unknown }).departureDelay = '5'

        expect(mapJourneys({ journeys: [raw] })[0].delaySeconds).toBe(0)
    })

    it('never reports a negative duration', () => {
        const raw = structuredClone(delayedDirectJourney)
        raw.legs[0].arrival = '2024-01-15T09:00:00+01:00'

        expect(mapJourneys({ journeys: [raw] })[0].durationMinutes).toBe(0)
    })

    it.each([
        ['no legs', { legs: [] }],
        ['no legs field', {}],
        [
            'unparseable departure',
            {
                legs: [
                    {
                        departure: 'soon',
                        plannedDeparture: 'soon',
                        arrival: null,
                        plannedArrival: '2024-01-15T10:00:00Z',
                    },
                ],
            },
        ],
        ['no times at all', { legs: [{}] }],
    ])(
        'drops a journey with %s instead of failing the list',
        (_label, broken) => {
            const result = mapJourneys({
                journeys: [broken, delayedDirectJourney],
            })

            expect(result).toHaveLength(1)
            expect(result[0].legs[0].line).toBe('ICE 599')
        }
    )

    it('answers a response without journeys with an empty list', () => {
        expect(mapJourneys({})).toEqual([])
    })

    it.each([null, 'text', [], { journeys: 'nope' }])(
        'rejects the malformed response %j',
        (payload) => {
            expect(() => mapJourneys(payload)).toThrow(ProviderResponseError)
        }
    )
})
