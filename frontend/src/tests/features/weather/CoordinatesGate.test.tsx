import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { CoordinatesGate } from '@/features/weather/CoordinatesGate'
import { MediumCard } from '@/shared/ui/CardFrame'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeGeocodingProvider } from '../../support/FakeGeocodingProvider'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderWithDeps } from '../../support/renderWithDeps'

const SETTINGS_KEY = 'magic-mirror.user-settings'

const renderGate = (
    options: {
        address?: Record<string, string>
        key?: string
        geocoding?: FakeGeocodingProvider
    } = {}
) => {
    if (options.address) {
        window.localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(options.address)
        )
    }
    const store = new InMemoryKeyValueStore()
    if (options.key)
        store.set(
            STORAGE_KEYS.apiKeys,
            JSON.stringify({ geocodeApiKey: options.key })
        )
    const test = createTestContainer({
        localStore: store,
        geocodingProvider: options.geocoding ?? new FakeGeocodingProvider(),
    })

    return renderWithDeps(
        <CoordinatesGate
            Card={MediumCard}
            loading={<div>loading placeholder</div>}
        >
            {(coordinates) => (
                <div>
                    ready {coordinates.latitude},{coordinates.longitude}
                </div>
            )}
        </CoordinatesGate>,
        { deps: test.deps }
    )
}

const FULL = { country: 'DE', city: 'Stuttgart', zip_code: '70176' }

describe('CoordinatesGate', () => {
    beforeEach(() => window.localStorage.clear())
    afterEach(() => window.localStorage.clear())

    it('shows the loading placeholder while the location is being resolved', () => {
        renderGate({ address: FULL, key: 'k' })

        expect(screen.getByText('loading placeholder')).toBeInTheDocument()
    })

    it('renders its children with the coordinates once they are known', async () => {
        renderGate({ address: FULL, key: 'k' })

        expect(
            await screen.findByText('ready 48.7758,9.1829')
        ).toBeInTheDocument()
        expect(
            screen.queryByText('loading placeholder')
        ).not.toBeInTheDocument()
    })

    it('tells the user to set a location when there is no address', async () => {
        renderGate({ key: 'k' })

        expect(
            await screen.findByText(
                'Longitude and or latitude are not set. Please update your location in the settings'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Settings' })
        ).toBeInTheDocument()
    })

    it('tells the user to add the API key when only the key is missing', async () => {
        renderGate({ address: FULL })

        expect(
            await screen.findByText(
                'No Geocode Maps API key is set. Please add it in the settings'
            )
        ).toBeInTheDocument()
    })

    it.each([
        [
            'not-found',
            'The location could not be found. Please check the address in the settings',
        ],
        [
            'unauthorized',
            'The Geocode Maps API key was rejected. Please check it in the settings',
        ],
        [
            'network',
            'The location could not be looked up right now. It will be retried automatically',
        ],
        [
            'invalid-response',
            'The location lookup returned an unexpected answer',
        ],
    ] as const)('explains the lookup failure "%s"', async (reason, message) => {
        renderGate({
            address: FULL,
            key: 'k',
            geocoding: new FakeGeocodingProvider().failWith(reason),
        })

        expect(await screen.findByText(message)).toBeInTheDocument()
    })
})
