import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { err } from '@/domain/shared/Result'
import type { AuthState } from '@/domain/auth/AuthToken'
import { SettingsPage } from '@/features/settings-page'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { FakeCalendarProvider } from '../../support/FakeCalendarProvider'
import { FakeGeocodingProvider } from '../../support/FakeGeocodingProvider'
import { FakeTrainProvider } from '../../support/FakeTrainProvider'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderWithDeps } from '../../support/renderWithDeps'

const SAVED = {
    country: 'FR',
    city: 'Paris',
    zip_code: '75001',
    events_cal_id: 'work@x',
    birthday_cal_id: 'bday@x',
    train_connections: [],
    train_display_settings: { mode: 'carousel', carousel_interval: 15 },
}

interface Options {
    settings?: Record<string, unknown>
    apiKey?: string
    auth?: AuthState
    geocoding?: FakeGeocodingProvider
    calendars?: Array<{ id: string; name: string; primary: boolean }>
    stations?: Array<{ id: string; name: string }>
    failWrites?: boolean
}

const renderPage = (options: Options = {}) => {
    const local = new InMemoryKeyValueStore()
    if (options.settings)
        local.set(STORAGE_KEYS.userSettings, JSON.stringify(options.settings))
    if (options.apiKey)
        local.set(
            STORAGE_KEYS.apiKeys,
            JSON.stringify({ geocodeApiKey: options.apiKey })
        )
    if (options.failWrites) local.failWrites = true

    const auth = new FakeAuthSession(options.auth ?? { status: 'signed-in' })
    const geocoding = options.geocoding ?? new FakeGeocodingProvider()
    const test = createTestContainer({
        localStore: local,
        authSession: auth,
        geocodingProvider: geocoding,
        calendarProvider: new FakeCalendarProvider({
            calendars: options.calendars ?? [],
        }),
        trainProvider: new FakeTrainProvider({
            stations: options.stations ?? [],
        }),
        config: { locale: 'en-US', docsUrl: 'https://docs.test/keys' },
    })
    const onBack = vi.fn()
    const user = userEvent.setup()
    renderWithDeps(<SettingsPage onBack={onBack} />, { deps: test.deps })

    return {
        local,
        auth,
        geocoding,
        test,
        user,
        onBack,
        savedSettings: () =>
            JSON.parse(local.get(STORAGE_KEYS.userSettings) ?? 'null'),
        savedKey: () =>
            JSON.parse(local.get(STORAGE_KEYS.apiKeys) ?? 'null')
                ?.geocodeApiKey,
        field: (label: string) =>
            screen.getByLabelText(label) as HTMLInputElement,
        send: () => user.click(screen.getByRole('button', { name: 'Send' })),
    }
}

afterEach(() => vi.restoreAllMocks())

describe('SettingsPage', () => {
    describe('what it shows', () => {
        it('pre-fills a first-time user with the example address and the primary calendar', () => {
            const { field } = renderPage()

            expect(
                screen.getByRole('combobox', { name: 'Country' })
            ).toHaveValue('Germany')
            expect(field('City')).toHaveValue('Stuttgart')
            expect(field('Zip Code')).toHaveValue('70176')
            expect(
                screen.getByRole('combobox', { name: 'Events Calendar ID' })
            ).toHaveValue('primary')
            expect(
                screen.getByRole('combobox', { name: 'Birthday Calendar ID' })
            ).toHaveValue('primary')
        })

        it('shows what was saved', () => {
            const { field } = renderPage({ settings: SAVED, apiKey: 'secret' })

            expect(
                screen.getByRole('combobox', { name: 'Country' })
            ).toHaveValue('France')
            expect(field('City')).toHaveValue('Paris')
            expect(field('Zip Code')).toHaveValue('75001')
            expect(
                screen.getByRole('combobox', { name: 'Events Calendar ID' })
            ).toHaveValue('work@x')
            expect(field('Geocode Maps API Key')).toHaveValue('secret')
        })

        it('links to the documentation about the API keys, from the configuration', () => {
            renderPage()

            const link = screen.getByTitle('How to get these API keys')
            expect(link).toHaveAttribute('href', 'https://docs.test/keys')
            expect(link).toHaveAttribute('target', '_blank')
            expect(link.getAttribute('rel')).toContain('noopener')
        })

        it('goes back', async () => {
            const { user, onBack } = renderPage()

            await user.click(screen.getByRole('button', { name: 'Back' }))

            expect(onBack).toHaveBeenCalledTimes(1)
        })
    })

    describe('saving', () => {
        it('locates the address with the key, stores both and says so', async () => {
            const { user, field, geocoding, savedSettings, savedKey, send } =
                renderPage()

            await user.type(field('Geocode Maps API Key'), 'abc')
            await send()

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'Settings saved'
            )
            expect(geocoding.calls).toEqual([
                {
                    address: {
                        country: 'DE',
                        city: 'Stuttgart',
                        postalCode: '70176',
                    },
                    apiKey: 'abc',
                },
            ])
            expect(savedKey()).toBe('abc')
            expect(savedSettings()).toMatchObject({
                country: 'DE',
                city: 'Stuttgart',
                zip_code: '70176',
                events_cal_id: 'primary',
                birthday_cal_id: 'primary',
            })
        })

        it('says when there is nothing to save, and does not call the location service', async () => {
            const { geocoding, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
            })

            await send()

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'No changes to save'
            )
            expect(geocoding.calls).toEqual([])
        })

        it('submits with the Enter key', async () => {
            const { user, field, geocoding } = renderPage({
                settings: SAVED,
                apiKey: 'k',
            })

            await user.type(field('City'), ' Centre{Enter}')

            await waitFor(() => expect(geocoding.calls).toHaveLength(1))
            expect(geocoding.calls[0].address.city).toBe('Paris Centre')
        })

        it('shows that it is saving, and cannot be submitted twice meanwhile', async () => {
            let finish: () => void = () => {}
            const geocoding = new FakeGeocodingProvider()
            geocoding.geocode = (address, apiKey) => {
                geocoding.calls.push({ address, apiKey })
                return new Promise((resolve) => {
                    finish = () => resolve(geocoding.result)
                })
            }
            const { user, field } = renderPage({
                settings: SAVED,
                apiKey: 'k',
                geocoding,
            })
            await user.type(field('City'), 'x')

            await user.click(screen.getByRole('button', { name: 'Send' }))
            const busy = await screen.findByRole('button', { name: 'Saving…' })
            expect(busy).toBeDisabled()
            // Enter in a field submits the form again: it must be ignored
            await user.type(field('City'), '{Enter}')
            act(() => finish())

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'Settings saved'
            )
            expect(geocoding.calls).toHaveLength(1)
            expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
        })

        it('stores the zip code and the birthday calendar as typed', async () => {
            const { user, field, savedSettings, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
            })

            await user.clear(field('Zip Code'))
            await user.type(field('Zip Code'), '75002')
            const birthdays = screen.getByRole('combobox', {
                name: 'Birthday Calendar ID',
            })
            await user.clear(birthdays)
            await user.type(birthdays, 'family@x')
            await send()

            await screen.findByText('Settings saved')
            expect(savedSettings()).toMatchObject({
                zip_code: '75002',
                birthday_cal_id: 'family@x',
            })
        })

        it('stores a chosen calendar by its id', async () => {
            const { user, savedSettings, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
                calendars: [{ id: 'fam@x', name: 'Family', primary: false }],
            })

            await user.click(
                screen.getByRole('combobox', { name: 'Events Calendar ID' })
            )
            await user.click(
                await screen.findByRole('option', { name: 'Family' })
            )
            await send()

            await screen.findByText('Settings saved')
            expect(savedSettings().events_cal_id).toBe('fam@x')
        })
    })

    describe('problems', () => {
        it('shows what is missing next to the fields, without asking anything else', async () => {
            const { user, field, geocoding, send } = renderPage({
                settings: SAVED,
            })
            await user.clear(field('City'))
            await user.clear(field('Zip Code'))

            await send()

            expect(
                await screen.findByText('Please enter a city or a postal code!')
            ).toBeInTheDocument()
            expect(
                screen.getByText('Geocode Maps API Key must not be empty!')
            ).toBeInTheDocument()
            expect(field('City')).toHaveAttribute('aria-invalid', 'true')
            expect(geocoding.calls).toEqual([])
        })

        it('shows a missing country and calendar', async () => {
            const { user, send } = renderPage({ settings: SAVED, apiKey: 'k' })
            await user.click(
                within(
                    screen
                        .getByRole('combobox', { name: 'Country' })
                        .closest('.MuiAutocomplete-root') as HTMLElement
                ).getByTitle('Clear')
            )

            await send()

            expect(
                await screen.findByText('Country must not be empty!')
            ).toBeInTheDocument()
        })

        it('takes an error away as soon as its field is edited', async () => {
            const { user, field, send } = renderPage({ settings: SAVED })
            await send()
            expect(
                await screen.findByText(
                    'Geocode Maps API Key must not be empty!'
                )
            ).toBeInTheDocument()

            await user.type(field('Geocode Maps API Key'), 'a')

            expect(
                screen.queryByText('Geocode Maps API Key must not be empty!')
            ).not.toBeInTheDocument()
        })

        it.each([
            ['not-found', 'Address could not be geolocated!'],
            [
                'unauthorized',
                'The Geocode Maps API key was rejected. Please check it.',
            ],
        ] as const)(
            'says what is wrong when the address lookup fails (%s), and saves nothing',
            async (reason, message) => {
                const geocoding = new FakeGeocodingProvider().failWith(reason)
                const { user, field, savedSettings, send } = renderPage({
                    settings: SAVED,
                    apiKey: 'k',
                    geocoding,
                })
                await user.type(field('City'), 'x')

                await send()

                expect(await screen.findByRole('alert')).toHaveTextContent(
                    message
                )
                expect(savedSettings().city).toBe('Paris')
            }
        )

        it('says when the browser storage refuses the write', async () => {
            const { user, field, local, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
            })
            local.failWrites = true
            await user.type(field('City'), 'x')

            await send()

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'Your settings could not be saved. The browser storage may be full or disabled.'
            )
        })

        it('never opens a browser alert dialog', async () => {
            const alert = vi
                .spyOn(window, 'alert')
                .mockImplementation(() => undefined)
            const geocoding = new FakeGeocodingProvider(err('not-found'))
            const { user, field, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
                geocoding,
            })
            await user.type(field('City'), 'x')

            await send()
            await screen.findByRole('alert')

            expect(alert).not.toHaveBeenCalled()
        })
    })

    describe('Google account', () => {
        it('offers to sign in when signed out', async () => {
            const { user, auth } = renderPage({
                auth: { status: 'signed-out' },
            })

            await user.click(
                screen.getByRole('button', { name: 'Sign in with Google' })
            )

            expect(auth.signIns).toBe(1)
        })

        it('offers to sign out when signed in', async () => {
            const { user, auth } = renderPage({ auth: { status: 'signed-in' } })

            await user.click(screen.getByRole('button', { name: 'Sign out' }))

            expect(auth.signOuts).toBe(1)
        })

        it('shows that signing in is under way, and cannot be started twice', () => {
            renderPage({ auth: { status: 'signing-in' } })

            expect(
                screen.getByRole('button', { name: 'Signing in…' })
            ).toBeDisabled()
        })

        it('explains why the last sign-in failed', () => {
            renderPage({
                auth: { status: 'signed-out', lastError: 'popup_closed' },
            })

            expect(
                screen.getByText(
                    'The Google sign-in window was closed before it finished.'
                )
            ).toBeInTheDocument()
        })

        it('offers the sign-in again when the renewal failed', () => {
            renderPage({ auth: { status: 'needs-reauth', reason: 'timeout' } })

            expect(
                screen.getByRole('button', { name: 'Sign in with Google' })
            ).toBeInTheDocument()
            expect(
                screen.getByText(
                    'Google sign-in took too long. Please try again.'
                )
            ).toBeInTheDocument()
        })
    })

    describe('train connections', () => {
        const STATIONS = [
            { id: 's1', name: 'Stuttgart Hbf' },
            { id: 's2', name: 'Frankfurt Hbf' },
        ]

        const pick = async (
            user: ReturnType<typeof userEvent.setup>,
            test: ReturnType<typeof createTestContainer>,
            label: string,
            typed: string,
            station: string
        ) => {
            await user.type(screen.getByLabelText(label), typed)
            act(() => test.scheduler.advance(300))
            await user.click(
                await screen.findByRole('option', { name: station })
            )
        }

        it('saves a new connection, with an id from the id generator', async () => {
            const { user, test, savedSettings, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
                stations: STATIONS,
            })

            await user.click(
                screen.getByRole('button', {
                    name: 'Add Train Connection (0/5)',
                })
            )
            await pick(user, test, 'Departure Station', 'Stu', 'Stuttgart Hbf')
            await pick(user, test, 'Arrival Station', 'Fra', 'Frankfurt Hbf')
            await send()

            await screen.findByText('Settings saved')
            expect(savedSettings().train_connections).toEqual([
                {
                    id: 'id-1',
                    departure_station_id: 's1',
                    departure_station_name: 'Stuttgart Hbf',
                    arrival_station_id: 's2',
                    arrival_station_name: 'Frankfurt Hbf',
                },
            ])
        })

        it('does not save a connection that has no stations yet', async () => {
            const { user, savedSettings, send } = renderPage({
                settings: SAVED,
                apiKey: 'k',
            })

            await user.click(
                screen.getByRole('button', {
                    name: 'Add Train Connection (0/5)',
                })
            )
            await send()

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'No changes to save'
            )
            expect(savedSettings().train_connections).toEqual([])
        })

        it('corrects the carousel interval when the field is left', async () => {
            const { user, field } = renderPage({ settings: SAVED, apiKey: 'k' })
            const interval = field('Carousel Interval (seconds)')

            await user.clear(interval)
            await user.type(interval, '2')
            expect(interval).toHaveValue(2)
            await user.tab()

            expect(interval).toHaveValue(5)
        })
    })
})
