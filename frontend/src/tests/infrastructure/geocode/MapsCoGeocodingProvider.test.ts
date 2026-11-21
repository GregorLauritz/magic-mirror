import { beforeEach, describe, expect, it } from 'vitest'
import { MapsCoGeocodingProvider } from '@/infrastructure/geocode/MapsCoGeocodingProvider'
import {
    HttpError,
    NetworkError,
    ProviderResponseError,
    TimeoutError,
} from '@/application/ports/errors'
import { FakeHttpClient } from '../../support/FakeHttpClient'

const BASE = 'https://geocode.test'
const ADDRESS = { country: 'DE', city: 'Stuttgart', postalCode: '70176' }
const hit = (lat: string, lon: string, importance?: number) => ({
    lat,
    lon,
    importance,
})

describe('MapsCoGeocodingProvider', () => {
    let http: FakeHttpClient
    let provider: MapsCoGeocodingProvider

    beforeEach(() => {
        http = new FakeHttpClient()
        provider = new MapsCoGeocodingProvider(http, BASE)
    })

    describe('request', () => {
        it('searches by country, city and postal code with the api key', async () => {
            http.when('/search').reply([hit('48.7', '9.1', 0.5)])

            await provider.geocode(ADDRESS, 'KEY')

            const url = new URL(http.requests[0].url)
            expect(`${url.origin}${url.pathname}`).toBe(`${BASE}/search`)
            expect(Object.fromEntries(url.searchParams)).toEqual({
                country: 'DE',
                api_key: 'KEY',
                postalcode: '70176',
                city: 'Stuttgart',
            })
        })

        it('leaves out the parts of the address that are blank', async () => {
            http.when('/search').reply([hit('48.7', '9.1')])

            await provider.geocode(
                { country: 'DE', city: 'Stuttgart', postalCode: ' ' },
                'KEY'
            )

            const params = new URL(http.requests[0].url).searchParams
            expect(params.has('postalcode')).toBe(false)
            expect(params.get('city')).toBe('Stuttgart')
        })

        it('forwards the abort signal', async () => {
            http.when('/search').reply([hit('48.7', '9.1')])
            const controller = new AbortController()

            await provider.geocode(ADDRESS, 'KEY', controller.signal)

            expect(http.requests[0].signal).toBe(controller.signal)
        })
    })

    describe('answer', () => {
        it('returns the coordinates, latitude first', async () => {
            http.when('/search').reply([hit('48.7758', '9.1829', 0.7)])

            await expect(provider.geocode(ADDRESS, 'KEY')).resolves.toEqual({
                ok: true,
                value: { latitude: 48.7758, longitude: 9.1829 },
            })
        })

        it('picks the most important of several matches', async () => {
            http.when('/search').reply([
                hit('1', '2', 0.1),
                hit('48.7', '9.1', 0.9),
                hit('3', '4', 0.5),
            ])

            const result = await provider.geocode(ADDRESS, 'KEY')

            expect(result).toEqual({
                ok: true,
                value: { latitude: 48.7, longitude: 9.1 },
            })
        })

        it('treats a match without importance as the least important', async () => {
            http.when('/search').reply([
                hit('1', '2'),
                hit('48.7', '9.1', 0.01),
            ])

            const result = await provider.geocode(ADDRESS, 'KEY')

            expect(result).toEqual({
                ok: true,
                value: { latitude: 48.7, longitude: 9.1 },
            })
        })

        it('reports "not-found" for an empty result list', async () => {
            http.when('/search').reply([])

            await expect(provider.geocode(ADDRESS, 'KEY')).resolves.toEqual({
                ok: false,
                error: 'not-found',
            })
        })

        it.each([
            [
                'non-numeric coordinates (B11: parseFloat gave NaN)',
                [hit('abc', '9.1', 1)],
            ],
            ['an out-of-range latitude', [hit('95', '9.1', 1)]],
            ['an out-of-range longitude', [hit('48.7', '200', 1)]],
            ['a payload that is not a list', { error: 'nope' }],
        ])('reports "invalid-response" for %s', async (_label, payload) => {
            http.when('/search').reply(payload)

            await expect(provider.geocode(ADDRESS, 'KEY')).resolves.toEqual({
                ok: false,
                error: 'invalid-response',
            })
        })
    })

    describe('failures', () => {
        it.each([
            [401, 'unauthorized'],
            [403, 'unauthorized'],
            [429, 'network'],
            [500, 'network'],
            [503, 'network'],
            [400, 'invalid-response'],
            [404, 'invalid-response'],
        ])('maps HTTP %i to "%s"', async (status, expected) => {
            http.when('/search').reply(
                new HttpError(status, `${BASE}/search?api_key=SECRET`)
            )

            await expect(provider.geocode(ADDRESS, 'KEY')).resolves.toEqual({
                ok: false,
                error: expected,
            })
        })

        it.each([
            ['a network error', new NetworkError('offline'), 'network'],
            ['a timeout', new TimeoutError('slow'), 'network'],
            [
                'a malformed body',
                new ProviderResponseError('bad json'),
                'invalid-response',
            ],
        ])('maps %s to "%s"', async (_label, failure, expected) => {
            http.when('/search').reply(failure)

            await expect(provider.geocode(ADDRESS, 'KEY')).resolves.toEqual({
                ok: false,
                error: expected,
            })
        })

        it('lets a cancellation through instead of reporting it as a lookup failure', async () => {
            const aborted = new DOMException('aborted', 'AbortError')
            http.when('/search').reply(aborted)

            await expect(provider.geocode(ADDRESS, 'KEY')).rejects.toBe(aborted)
        })
    })
})
