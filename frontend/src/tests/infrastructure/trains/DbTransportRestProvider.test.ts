import { beforeEach, describe, expect, it } from 'vitest'
import { DbTransportRestProvider } from '@/infrastructure/trains/DbTransportRestProvider'
import {
    journeysResponse,
    stationsResponse,
} from '../../fixtures/dbTransportRest'
import { FakeHttpClient } from '../../support/FakeHttpClient'

const BASE = 'https://db.test/v6'

describe('DbTransportRestProvider', () => {
    let http: FakeHttpClient
    let provider: DbTransportRestProvider

    beforeEach(() => {
        http = new FakeHttpClient()
        provider = new DbTransportRestProvider(http, BASE)
    })

    describe('searchStations', () => {
        it('asks for stations only: no points of interest, no addresses', async () => {
            http.when('db.test').reply(stationsResponse)

            await provider.searchStations('Stuttgart Hbf', 10)

            const url = new URL(http.requests[0].url)
            expect(`${url.origin}${url.pathname}`).toBe(`${BASE}/locations`)
            expect(Object.fromEntries(url.searchParams)).toEqual({
                query: 'Stuttgart Hbf',
                results: '10',
                poi: 'false',
                addresses: 'false',
            })
        })

        it('maps the answer and forwards the abort signal', async () => {
            http.when('db.test').reply(stationsResponse)
            const controller = new AbortController()

            const stations = await provider.searchStations(
                'Stu',
                10,
                controller.signal
            )

            expect(stations.map((s) => s.name)).toEqual([
                'Stuttgart Hbf',
                'Frankfurt(Main)Hbf',
            ])
            expect(http.requests[0].signal).toBe(controller.signal)
        })

        it('keeps characters of the query that could break the url intact', async () => {
            http.when('db.test').reply([])

            await provider.searchStations('Frankfurt (Main) & Co?#', 5)

            expect(
                new URL(http.requests[0].url).searchParams.get('query')
            ).toBe('Frankfurt (Main) & Co?#')
        })
    })

    describe('getJourneys', () => {
        it('asks for the journeys between two stations', async () => {
            http.when('db.test').reply(journeysResponse)

            await provider.getJourneys({
                fromId: '8000096',
                toId: '8000105',
                limit: 2,
            })

            const url = new URL(http.requests[0].url)
            expect(`${url.origin}${url.pathname}`).toBe(`${BASE}/journeys`)
            expect(Object.fromEntries(url.searchParams)).toEqual({
                from: '8000096',
                to: '8000105',
                results: '2',
            })
        })

        it('maps the answer and forwards the abort signal', async () => {
            http.when('db.test').reply(journeysResponse)
            const controller = new AbortController()

            const journeys = await provider.getJourneys(
                { fromId: 'a', toId: 'b', limit: 2 },
                controller.signal
            )

            expect(journeys).toHaveLength(2)
            expect(http.requests[0].signal).toBe(controller.signal)
        })
    })
})
