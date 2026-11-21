import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useCoordinates } from '@/features/weather/useCoordinates'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeGeocodingProvider } from '../../support/FakeGeocodingProvider'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderHookWithDeps } from '../../support/renderWithDeps'

// Transitional: the address still comes from the legacy settings hook, which
// reads the real localStorage (replaced by the settings store in step S5).
const SETTINGS_KEY = 'magic-mirror.user-settings'

const saveAddress = (address: Record<string, string>) =>
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(address))

const keyStore = (geocodeApiKey?: string) => {
    const store = new InMemoryKeyValueStore()
    if (geocodeApiKey !== undefined) {
        store.set(STORAGE_KEYS.apiKeys, JSON.stringify({ geocodeApiKey }))
    }
    return store
}

const FULL = { country: 'DE', city: 'Stuttgart', zip_code: '70176' }

const setup = (
    options: { key?: string; geocoding?: FakeGeocodingProvider } = {}
) => {
    const geocoding = options.geocoding ?? new FakeGeocodingProvider()
    const test = createTestContainer({
        geocodingProvider: geocoding,
        localStore: keyStore('key' in options ? options.key : 'k'),
    })
    const rendered = renderHookWithDeps(() => useCoordinates(), {
        deps: test.deps,
    })
    return { ...rendered, geocoding }
}

describe('useCoordinates', () => {
    beforeEach(() => window.localStorage.clear())
    afterEach(() => window.localStorage.clear())

    it('is loading until the saved settings have been read', () => {
        saveAddress(FULL)

        const { result } = setup()

        expect(result.current).toEqual({ status: 'loading' })
    })

    it('resolves a complete address to coordinates', async () => {
        saveAddress(FULL)

        const { result, geocoding } = setup()

        await waitFor(() =>
            expect(result.current).toEqual({
                status: 'ready',
                coordinates: { latitude: 48.7758, longitude: 9.1829 },
            })
        )
        expect(geocoding.calls).toEqual([
            {
                address: {
                    country: 'DE',
                    city: 'Stuttgart',
                    postalCode: '70176',
                },
                apiKey: 'k',
            },
        ])
    })

    it('looks up an address with a city but no postal code (B11a)', async () => {
        saveAddress({ country: 'DE', city: 'Stuttgart' })

        const { result, geocoding } = setup()

        await waitFor(() => expect(result.current.status).toBe('ready'))
        expect(geocoding.calls).toHaveLength(1)
    })

    it('treats (0, 0) as a real location, not as "unknown" (B10)', async () => {
        saveAddress(FULL)
        const geocoding = new FakeGeocodingProvider({
            ok: true,
            value: { latitude: 0, longitude: 0 },
        })

        const { result } = setup({ geocoding })

        await waitFor(() =>
            expect(result.current).toEqual({
                status: 'ready',
                coordinates: { latitude: 0, longitude: 0 },
            })
        )
    })

    it.each([
        ['nothing saved', undefined],
        ['a country-only address', { country: 'DE' }],
    ])(
        'asks for an address (%s) without calling the provider',
        async (_label, saved) => {
            if (saved) saveAddress(saved)

            const { result, geocoding } = setup()

            await waitFor(() =>
                expect(result.current).toEqual({
                    status: 'not-configured',
                    reason: 'no-address',
                })
            )
            expect(geocoding.calls).toEqual([])
        }
    )

    it('asks for the API key when there is an address but no key', async () => {
        saveAddress(FULL)

        const { result, geocoding } = setup({ key: '' })

        await waitFor(() =>
            expect(result.current).toEqual({
                status: 'not-configured',
                reason: 'no-api-key',
            })
        )
        expect(geocoding.calls).toEqual([])
    })

    it.each([
        'not-found',
        'unauthorized',
        'network',
        'invalid-response',
    ] as const)(
        'reports the lookup failure "%s" as an error state',
        async (reason) => {
            saveAddress(FULL)

            const { result } = setup({
                geocoding: new FakeGeocodingProvider().failWith(reason),
            })

            await waitFor(() =>
                expect(result.current).toEqual({ status: 'error', reason })
            )
        }
    )

    it('recovers on its own once the network is back (a kiosk gets no window-focus event)', async () => {
        saveAddress(FULL)
        const geocoding = new FakeGeocodingProvider().failWith('network')
        const test = createTestContainer({
            config: { refreshIntervalMs: 30 },
            geocodingProvider: geocoding,
            localStore: keyStore('k'),
        })
        const { result } = renderHookWithDeps(() => useCoordinates(), {
            deps: test.deps,
        })
        await waitFor(() =>
            expect(result.current).toEqual({
                status: 'error',
                reason: 'network',
            })
        )

        geocoding.result = { ok: true, value: { latitude: 1, longitude: 2 } }

        await waitFor(() =>
            expect(result.current).toEqual({
                status: 'ready',
                coordinates: { latitude: 1, longitude: 2 },
            })
        )
    })

    it.each(['not-found', 'unauthorized'] as const)(
        'does not keep calling the rate-limited provider after "%s"',
        async (reason) => {
            saveAddress(FULL)
            const geocoding = new FakeGeocodingProvider().failWith(reason)
            const test = createTestContainer({
                config: { refreshIntervalMs: 20 },
                geocodingProvider: geocoding,
                localStore: keyStore('k'),
            })
            const { result } = renderHookWithDeps(() => useCoordinates(), {
                deps: test.deps,
            })
            await waitFor(() =>
                expect(result.current).toEqual({ status: 'error', reason })
            )

            await new Promise((resolve) => setTimeout(resolve, 120))

            expect(geocoding.calls).toHaveLength(1)
        }
    )

    it('does not look the address up again when the component re-renders', async () => {
        saveAddress(FULL)
        const { result, rerender, geocoding } = setup()
        await waitFor(() => expect(result.current.status).toBe('ready'))

        rerender()
        rerender()

        expect(geocoding.calls).toHaveLength(1)
    })
})
