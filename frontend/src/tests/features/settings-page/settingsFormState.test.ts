import { describe, expect, it } from 'vitest'
import { DEFAULT_ADDRESS } from '@/domain/location/Address'
import { MAX_TRAIN_ROUTES } from '@/domain/settings/settingsRules'
import {
    DEFAULT_TRAIN_DISPLAY,
    EMPTY_SETTINGS,
    type SavedRoute,
    type UserSettings,
} from '@/domain/settings/UserSettings'
import {
    formReducer,
    initialFormState,
    toSettingsInput,
    type FormState,
} from '@/features/settings-page/settingsFormState'

const KEYS = { geocodeApiKey: 'key' }
const route = (id: string): SavedRoute => ({
    id,
    from: { id: `${id}-a`, name: `${id} A` },
    to: { id: `${id}-b`, name: `${id} B` },
})

const SAVED: UserSettings = {
    address: { country: 'FR', city: 'Paris', postalCode: '75001' },
    eventsCalendarId: 'work',
    birthdayCalendarId: 'bday',
    trainRoutes: [route('r1')],
    trainDisplay: { mode: 'multiple', carouselIntervalSeconds: 20 },
}

const start = (settings: UserSettings = SAVED): FormState =>
    initialFormState(settings, KEYS)

describe('initialFormState', () => {
    it('shows the saved settings and key', () => {
        expect(start()).toEqual({
            country: 'FR',
            city: 'Paris',
            postalCode: '75001',
            eventsCalendarId: 'work',
            birthdayCalendarId: 'bday',
            geocodeApiKey: 'key',
            trainRoutes: [route('r1')],
            trainMode: 'multiple',
            carouselIntervalText: '20',
        })
    })

    it('pre-fills a first-time user with the example address, never saved as a setting', () => {
        const state = start(EMPTY_SETTINGS)

        expect(state).toMatchObject({
            country: DEFAULT_ADDRESS.country,
            city: DEFAULT_ADDRESS.city,
            postalCode: DEFAULT_ADDRESS.postalCode,
        })
        expect(EMPTY_SETTINGS.address).toBeUndefined()
    })

    it.each([undefined, '', '   '])(
        'uses the primary calendar when none is saved (%j)',
        (id) => {
            const state = start({
                ...EMPTY_SETTINGS,
                eventsCalendarId: id,
                birthdayCalendarId: id,
            })

            expect(state.eventsCalendarId).toBe('primary')
            expect(state.birthdayCalendarId).toBe('primary')
        }
    )

    it('starts with the default train display', () => {
        expect(start(EMPTY_SETTINGS)).toMatchObject({
            trainMode: DEFAULT_TRAIN_DISPLAY.mode,
            carouselIntervalText: String(
                DEFAULT_TRAIN_DISPLAY.carouselIntervalSeconds
            ),
        })
    })
})

describe('formReducer', () => {
    it.each([
        'country',
        'city',
        'postalCode',
        'eventsCalendarId',
        'birthdayCalendarId',
        'geocodeApiKey',
        'carouselIntervalText',
    ] as const)('sets the text field %s', (field) => {
        const next = formReducer(start(), { type: 'text', field, value: 'new' })

        expect(next[field]).toBe('new')
        expect(next).toEqual({ ...start(), [field]: 'new' })
    })

    it('sets the train display mode', () => {
        expect(
            formReducer(start(), { type: 'trainMode', mode: 'carousel' })
                .trainMode
        ).toBe('carousel')
    })

    describe('routes', () => {
        it('adds an empty route with the given id', () => {
            const next = formReducer(start(), {
                type: 'addRoute',
                id: 'new-id',
            })

            expect(next.trainRoutes).toEqual([
                route('r1'),
                {
                    id: 'new-id',
                    from: { id: '', name: '' },
                    to: { id: '', name: '' },
                },
            ])
        })

        it(`stops adding at ${MAX_TRAIN_ROUTES} routes`, () => {
            let state = start({ ...SAVED, trainRoutes: [] })
            for (let i = 0; i < MAX_TRAIN_ROUTES + 2; i++) {
                state = formReducer(state, { type: 'addRoute', id: `r${i}` })
            }

            expect(state.trainRoutes).toHaveLength(MAX_TRAIN_ROUTES)
        })

        it('removes a route by id', () => {
            const state = start({
                ...SAVED,
                trainRoutes: [route('r1'), route('r2')],
            })

            expect(
                formReducer(state, { type: 'removeRoute', id: 'r1' })
                    .trainRoutes
            ).toEqual([route('r2')])
        })

        it('replaces a route, keeping the order', () => {
            const state = start({
                ...SAVED,
                trainRoutes: [route('r1'), route('r2')],
            })
            const changed = { ...route('r1'), to: { id: 'x', name: 'X' } }

            expect(
                formReducer(state, { type: 'updateRoute', route: changed })
                    .trainRoutes
            ).toEqual([changed, route('r2')])
        })

        it('ignores a route it does not know', () => {
            const state = start()

            expect(
                formReducer(state, {
                    type: 'updateRoute',
                    route: route('ghost'),
                })
            ).toEqual(state)
            expect(
                formReducer(state, { type: 'removeRoute', id: 'ghost' })
            ).toEqual(state)
        })
    })

    describe('commitInterval (clamped when the field is left, not on every keystroke)', () => {
        it.each([
            ['', '15'],
            ['abc', '15'],
            ['0', '15'],
            ['3', '5'],
            ['5', '5'],
            ['42', '42'],
            ['12.7', '12'],
        ])('%j becomes %s', (typed, committed) => {
            let state = formReducer(start(), {
                type: 'text',
                field: 'carouselIntervalText',
                value: typed,
            })

            state = formReducer(state, { type: 'commitInterval' })

            expect(state.carouselIntervalText).toBe(committed)
        })

        it('leaves the typed text alone until then', () => {
            const state = formReducer(start(), {
                type: 'text',
                field: 'carouselIntervalText',
                value: '1',
            })

            expect(state.carouselIntervalText).toBe('1')
        })
    })
})

describe('toSettingsInput', () => {
    it('turns the form into what is saved', () => {
        expect(toSettingsInput(start())).toEqual({
            address: { country: 'FR', city: 'Paris', postalCode: '75001' },
            eventsCalendarId: 'work',
            birthdayCalendarId: 'bday',
            trainRoutes: [route('r1')],
            trainDisplay: { mode: 'multiple', carouselIntervalSeconds: 20 },
            geocodeApiKey: 'key',
        })
    })

    it('reads a half-typed interval the way it will be committed', () => {
        const state = formReducer(start(), {
            type: 'text',
            field: 'carouselIntervalText',
            value: '2',
        })

        expect(
            toSettingsInput(state).trainDisplay.carouselIntervalSeconds
        ).toBe(5)
    })
})
