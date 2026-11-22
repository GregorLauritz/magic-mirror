import { describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useCoordinates } from '@/features/weather/useCoordinates'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeGeocodingProvider } from '../../support/FakeGeocodingProvider'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const FULL = { country: 'DE', city: 'Stuttgart', zip_code: '70176' }

const setup = (
    options: {
        address?: Record<string, string>
        key?: string
        geocoding?: FakeGeocodingProvider
        refreshIntervalMs?: number
    } = {}
) => {
    const geocoding = options.geocoding ?? new FakeGeocodingProvider()
    const localStore = new InMemoryKeyValueStore()
    if (options.address)
        localStore.set(
            STORAGE_KEYS.userSettings,
            JSON.stringify(options.address)
        )
    if (options.key !== undefined) {
        localStore.set(
            STORAGE_KEYS.apiKeys,
            JSON.stringify({ geocodeApiKey: options.key })
        )
    }
    const test = createTestContainer({
        geocodingProvider: geocoding,
        localStore,
        config: { refreshIntervalMs: options.refreshIntervalMs ?? 120_000 },
    })
    const rendered = renderHookWithDeps(() => useCoordinates(), {
        deps: test.deps,
    })
    return { ...rendered, geocoding }
}

describe('useCoordinates', () => {
    it('is loading while the address is being looked up', () => {
        const { result } = setup({ address: FULL, key: 'k' })

        expect(result.current).toEqual({ status: 'loading' })
    })

    it('resolves a complete address to coordinates', async () => {
        const { result, geocoding } = setup({ address: FULL, key: 'k' })

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
        const { result, geocoding } = setup({
            address: { country: 'DE', city: 'Stuttgart' },
            key: 'k',
        })

        await waitFor(() => expect(result.current.status).toBe('ready'))
        expect(geocoding.calls).toHaveLength(1)
    })

    it('treats (0, 0) as a real location, not as "unknown" (B10)', async () => {
        const geocoding = new FakeGeocodingProvider({
            ok: true,
            value: { latitude: 0, longitude: 0 },
        })

        const { result } = setup({ address: FULL, key: 'k', geocoding })

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
        (_label, address) => {
            const { result, geocoding } = setup({ address, key: 'k' })

            expect(result.current).toEqual({
                status: 'not-configured',
                reason: 'no-address',
            })
            expect(geocoding.calls).toEqual([])
        }
    )

    it('asks for the API key when there is an address but no key', () => {
        const { result, geocoding } = setup({ address: FULL, key: '' })

        expect(result.current).toEqual({
            status: 'not-configured',
            reason: 'no-api-key',
        })
        expect(geocoding.calls).toEqual([])
    })

    it('reacts when the user saves an address, without a reload', async () => {
        const { result, geocoding, deps } = setup({ key: 'k' })
        expect(result.current).toEqual({
            status: 'not-configured',
            reason: 'no-address',
        })

        deps!.settings.patch({
            address: { country: 'DE', city: 'Berlin', postalCode: '' },
        })

        await waitFor(() => expect(result.current.status).toBe('ready'))
        expect(geocoding.calls).toHaveLength(1)
    })

    it.each([
        'not-found',
        'unauthorized',
        'network',
        'invalid-response',
    ] as const)(
        'reports the lookup failure "%s" as an error state',
        async (reason) => {
            const { result } = setup({
                address: FULL,
                key: 'k',
                geocoding: new FakeGeocodingProvider().failWith(reason),
            })

            await waitFor(() =>
                expect(result.current).toEqual({ status: 'error', reason })
            )
        }
    )

    it('recovers on its own once the network is back (a kiosk gets no window-focus event)', async () => {
        const geocoding = new FakeGeocodingProvider().failWith('network')
        const { result } = setup({
            address: FULL,
            key: 'k',
            geocoding,
            refreshIntervalMs: 30,
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
            const geocoding = new FakeGeocodingProvider().failWith(reason)
            const { result } = setup({
                address: FULL,
                key: 'k',
                geocoding,
                refreshIntervalMs: 20,
            })
            await waitFor(() =>
                expect(result.current).toEqual({ status: 'error', reason })
            )

            await new Promise((resolve) => setTimeout(resolve, 120))

            expect(geocoding.calls).toHaveLength(1)
        }
    )

    it('does not look the address up again when the component re-renders', async () => {
        const { result, rerender, geocoding } = setup({
            address: FULL,
            key: 'k',
        })
        await waitFor(() => expect(result.current.status).toBe('ready'))

        rerender()
        rerender()

        expect(geocoding.calls).toHaveLength(1)
    })
})
