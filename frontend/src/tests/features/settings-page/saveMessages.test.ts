import { describe, expect, it } from 'vitest'
import {
    describeFieldErrors,
    describeSaveFailure,
} from '@/features/settings-page/saveMessages'

describe('describeFieldErrors', () => {
    it('words each field error', () => {
        expect(
            describeFieldErrors({
                country: 'required',
                city: 'address-incomplete',
                eventsCalendarId: 'required',
                birthdayCalendarId: 'required',
                geocodeApiKey: 'required',
            })
        ).toEqual({
            country: 'Country must not be empty!',
            city: 'Please enter a city or a postal code!',
            eventsCalendarId: 'Events Calendar must not be empty!',
            birthdayCalendarId: 'Birthday Calendar must not be empty!',
            geocodeApiKey: 'Geocode Maps API Key must not be empty!',
        })
    })

    it('words only the fields that have an error', () => {
        expect(describeFieldErrors({ geocodeApiKey: 'required' })).toEqual({
            geocodeApiKey: 'Geocode Maps API Key must not be empty!',
        })
    })
})

describe('describeSaveFailure', () => {
    it.each([
        ['not-found', 'Address could not be geolocated!'],
        [
            'unauthorized',
            'The Geocode Maps API key was rejected. Please check it.',
        ],
        [
            'network',
            'The location service could not be reached. Please try again.',
        ],
        [
            'invalid-response',
            'The location service returned an unexpected answer.',
        ],
    ] as const)(
        'says what is wrong when the address lookup fails with %s',
        (reason, message) => {
            expect(
                describeSaveFailure({ kind: 'geocode-failed', reason })
            ).toBe(message)
        }
    )

    it('says when the storage failed', () => {
        expect(describeSaveFailure({ kind: 'storage-failed' })).toBe(
            'Your settings could not be saved. The browser storage may be full or disabled.'
        )
    })
})
