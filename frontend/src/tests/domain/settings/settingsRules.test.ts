import { describe, expect, it } from 'vitest'
import {
    clampCarouselInterval,
    dropIncompleteRoutes,
    settingsEqual,
    settingsFromInput,
    validateSettingsInput,
} from '@/domain/settings/settingsRules'
import {
    DEFAULT_TRAIN_DISPLAY,
    EMPTY_SETTINGS,
    type SavedRoute,
    type SettingsInput,
    type UserSettings,
} from '@/domain/settings/UserSettings'

const route = (id: string, from = '1', to = '2'): SavedRoute => ({
    id,
    from: { id: from, name: `From ${from}` },
    to: { id: to, name: `To ${to}` },
})

const settings = (overrides: Partial<UserSettings> = {}): UserSettings => ({
    ...EMPTY_SETTINGS,
    address: { country: 'DE', city: 'Stuttgart', postalCode: '70176' },
    eventsCalendarId: 'primary',
    birthdayCalendarId: 'primary',
    ...overrides,
})

const input = (overrides: Partial<SettingsInput> = {}): SettingsInput => ({
    address: { country: 'DE', city: 'Stuttgart', postalCode: '70176' },
    eventsCalendarId: 'primary',
    birthdayCalendarId: 'bday',
    trainRoutes: [],
    trainDisplay: DEFAULT_TRAIN_DISPLAY,
    geocodeApiKey: 'key',
    ...overrides,
})

describe('clampCarouselInterval', () => {
    it.each([
        ['10', 10],
        [10, 10],
        ['5', 5],
        ['3', 5], // below the minimum
        [-5, 5],
        ['12.7', 12],
        ['', 15], // nothing typed: the default
        ['abc', 15],
        ['0', 15],
    ])('turns %j into %i', (raw, expected) => {
        expect(clampCarouselInterval(raw)).toBe(expected)
    })
})

describe('dropIncompleteRoutes', () => {
    it('keeps routes with both stations and drops the half-filled ones', () => {
        const kept = route('a')
        const result = dropIncompleteRoutes([
            kept,
            route('b', '', '2'),
            route('c', '1', ''),
            route('d', ' ', '2'),
        ])

        expect(result).toEqual([kept])
    })
})

describe('settingsEqual', () => {
    it('is true for the same content in different objects', () => {
        const a = settings({
            trainRoutes: [route('r')],
            layout: [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }],
        })
        const b = settings({
            trainRoutes: [route('r')],
            layout: [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }],
        })

        expect(settingsEqual(a, b)).toBe(true)
    })

    it('treats an absent optional field and an undefined one alike', () => {
        const withUndefined = { ...settings(), layout: undefined }

        expect(settingsEqual(settings(), withUndefined)).toBe(true)
    })

    it.each([
        [
            'the address',
            settings({
                address: { country: 'FR', city: 'Paris', postalCode: '' },
            }),
        ],
        ['an address that is no longer set', settings({ address: undefined })],
        ['the events calendar', settings({ eventsCalendarId: 'other' })],
        ['the birthday calendar', settings({ birthdayCalendarId: 'other' })],
        ['the train routes', settings({ trainRoutes: [route('r')] })],
        [
            'the display mode',
            settings({
                trainDisplay: { mode: 'multiple', carouselIntervalSeconds: 15 },
            }),
        ],
        [
            'the carousel interval',
            settings({
                trainDisplay: { mode: 'carousel', carouselIntervalSeconds: 30 },
            }),
        ],
        [
            'the layout',
            settings({
                layout: [{ widgetId: 'time', x: 1, y: 0, w: 1, h: 1 }],
            }),
        ],
    ])('is false when %s differs', (_label, other) => {
        expect(settingsEqual(settings(), other)).toBe(false)
    })

    it('is sensitive to the order of the train routes', () => {
        const forward = settings({ trainRoutes: [route('a'), route('b')] })
        const backward = settings({ trainRoutes: [route('b'), route('a')] })

        expect(settingsEqual(forward, backward)).toBe(false)
    })
})

describe('validateSettingsInput', () => {
    it('accepts a complete input and trims the text fields', () => {
        const result = validateSettingsInput(
            input({
                address: {
                    country: 'DE',
                    city: ' Stuttgart ',
                    postalCode: ' 70176 ',
                },
                geocodeApiKey: '  key  ',
            })
        )

        expect(result).toEqual({
            ok: true,
            value: input({
                address: {
                    country: 'DE',
                    city: 'Stuttgart',
                    postalCode: '70176',
                },
                geocodeApiKey: 'key',
            }),
        })
    })

    it.each([
        [
            'a missing country',
            input({ address: { country: '', city: 'X', postalCode: '1' } }),
            { country: 'required' },
        ],
        [
            'a country-only address (Q6)',
            input({ address: { country: 'DE', city: '', postalCode: '' } }),
            { city: 'address-incomplete' },
        ],
        [
            'a missing birthday calendar',
            input({ birthdayCalendarId: ' ' }),
            { birthdayCalendarId: 'required' },
        ],
        [
            'a missing events calendar',
            input({ eventsCalendarId: '' }),
            { eventsCalendarId: 'required' },
        ],
        [
            'a missing API key',
            input({ geocodeApiKey: '' }),
            { geocodeApiKey: 'required' },
        ],
    ])('rejects %s', (_label, bad, errors) => {
        expect(validateSettingsInput(bad)).toEqual({ ok: false, error: errors })
    })

    it('reports every problem at once', () => {
        const result = validateSettingsInput(
            input({
                address: { country: '', city: '', postalCode: '' },
                eventsCalendarId: '',
                geocodeApiKey: '',
            })
        )

        expect(result).toEqual({
            ok: false,
            error: {
                country: 'required',
                eventsCalendarId: 'required',
                geocodeApiKey: 'required',
            },
        })
    })
})

describe('settingsFromInput', () => {
    it('replaces what the form edits and keeps the layout, which the form does not', () => {
        const layout = [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }]
        const current = settings({ layout, trainRoutes: [route('old')] })

        const next = settingsFromInput(
            input({
                trainRoutes: [route('new'), route('half', '', '2')],
                trainDisplay: { mode: 'multiple', carouselIntervalSeconds: 2 },
            }),
            current
        )

        expect(next.layout).toBe(layout)
        expect(next.address).toEqual({
            country: 'DE',
            city: 'Stuttgart',
            postalCode: '70176',
        })
        expect(next.birthdayCalendarId).toBe('bday')
        expect(next.trainRoutes).toEqual([route('new')]) // incomplete route dropped
        expect(next.trainDisplay).toEqual({
            mode: 'multiple',
            carouselIntervalSeconds: 5,
        }) // clamped
    })
})
