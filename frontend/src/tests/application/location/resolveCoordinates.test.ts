import { describe, expect, it } from 'vitest'
import { createResolveCoordinates } from '@/application/location/resolveCoordinates'
import { ok } from '@/domain/shared/Result'
import { FakeGeocodingProvider } from '../../support/FakeGeocodingProvider'

const ADDRESS = { country: 'DE', city: 'Stuttgart', postalCode: '70176' }

describe('resolveCoordinates', () => {
    it('looks the address up with the key and returns the coordinates', async () => {
        const geocoding = new FakeGeocodingProvider()

        const result = await createResolveCoordinates({ geocoding })(
            ADDRESS,
            'KEY'
        )

        expect(result).toEqual(ok({ latitude: 48.7758, longitude: 9.1829 }))
        expect(geocoding.calls).toEqual([{ address: ADDRESS, apiKey: 'KEY' }])
    })

    it('accepts (0, 0) as an answer instead of treating it as "unknown" (B10)', async () => {
        const geocoding = new FakeGeocodingProvider(
            ok({ latitude: 0, longitude: 0 })
        )

        const result = await createResolveCoordinates({ geocoding })(
            ADDRESS,
            'KEY'
        )

        expect(result).toEqual(ok({ latitude: 0, longitude: 0 }))
    })

    it.each([
        ['no address', undefined],
        ['a country-only address', { country: 'DE', city: '', postalCode: '' }],
    ])('does not call the provider for %s', async (_label, address) => {
        const geocoding = new FakeGeocodingProvider()

        const result = await createResolveCoordinates({ geocoding })(
            address,
            'KEY'
        )

        expect(result).toEqual({ ok: false, error: 'not-configured' })
        expect(geocoding.calls).toEqual([])
    })

    it.each(['', '   '])(
        'does not call the provider with the blank key %j',
        async (key) => {
            const geocoding = new FakeGeocodingProvider()

            const result = await createResolveCoordinates({ geocoding })(
                ADDRESS,
                key
            )

            expect(result).toEqual({ ok: false, error: 'no-api-key' })
            expect(geocoding.calls).toEqual([])
        }
    )

    it.each([
        'not-found',
        'unauthorized',
        'network',
        'invalid-response',
    ] as const)(
        'passes the provider failure "%s" through unchanged',
        async (error) => {
            const geocoding = new FakeGeocodingProvider().failWith(error)

            const result = await createResolveCoordinates({ geocoding })(
                ADDRESS,
                'KEY'
            )

            expect(result).toEqual({ ok: false, error })
        }
    )
})
