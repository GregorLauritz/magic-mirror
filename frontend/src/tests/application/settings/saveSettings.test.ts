import { describe, expect, it, vi } from 'vitest'
import type { ApiKeyRepository } from '@/application/ports/ApiKeyRepository'
import type { SettingsRepository } from '@/application/ports/SettingsRepository'
import { ApiKeyStore } from '@/application/settings/ApiKeyStore'
import { createSaveSettings } from '@/application/settings/saveSettings'
import { SettingsStore } from '@/application/settings/SettingsStore'
import type { ApiKeys } from '@/domain/settings/ApiKeys'
import {
    DEFAULT_TRAIN_DISPLAY,
    EMPTY_SETTINGS,
    type SettingsInput,
    type UserSettings,
} from '@/domain/settings/UserSettings'
import { FakeGeocodingProvider } from '../../support/FakeGeocodingProvider'

const ADDRESS = { country: 'DE', city: 'Stuttgart', postalCode: '70176' }

const input = (overrides: Partial<SettingsInput> = {}): SettingsInput => ({
    address: ADDRESS,
    eventsCalendarId: 'primary',
    birthdayCalendarId: 'bday',
    trainRoutes: [],
    trainDisplay: DEFAULT_TRAIN_DISPLAY,
    geocodeApiKey: 'new-key',
    ...overrides,
})

interface Options {
    settings?: UserSettings
    keys?: ApiKeys
    failSettingsWrite?: boolean
    geocoding?: FakeGeocodingProvider
}

const setup = (options: Options = {}) => {
    const settingsRepo: SettingsRepository = {
        load: () => options.settings ?? EMPTY_SETTINGS,
        save: vi.fn(() => !options.failSettingsWrite),
        clear: vi.fn(),
    }
    const keyRepo: ApiKeyRepository & { saved: ApiKeys[] } = {
        saved: [],
        load: () => options.keys ?? { geocodeApiKey: '' },
        save: vi.fn((keys: ApiKeys) => {
            keyRepo.saved.push(keys)
            return true
        }),
        clear: vi.fn(),
    }
    const settings = new SettingsStore(settingsRepo)
    const apiKeys = new ApiKeyStore(keyRepo)
    const geocoding = options.geocoding ?? new FakeGeocodingProvider()
    const save = createSaveSettings({ settings, apiKeys, geocoding })
    return { save, settings, apiKeys, geocoding, settingsRepo, keyRepo }
}

describe('saveSettings', () => {
    it('validates first: field errors, and nothing is looked up or persisted', async () => {
        const { save, geocoding, settingsRepo, keyRepo } = setup()

        const result = await save(
            input({ eventsCalendarId: '', geocodeApiKey: '' })
        )

        expect(result).toEqual({
            ok: false,
            error: {
                kind: 'validation',
                fields: {
                    eventsCalendarId: 'required',
                    geocodeApiKey: 'required',
                },
            },
        })
        expect(geocoding.calls).toEqual([])
        expect(settingsRepo.save).not.toHaveBeenCalled()
        expect(keyRepo.save).not.toHaveBeenCalled()
    })

    it('rejects a country-only address before spending a geocoding request (Q6)', async () => {
        const { save, geocoding } = setup()

        const result = await save(
            input({ address: { country: 'DE', city: '', postalCode: '' } })
        )

        expect(result).toMatchObject({
            ok: false,
            error: {
                kind: 'validation',
                fields: { city: 'address-incomplete' },
            },
        })
        expect(geocoding.calls).toEqual([])
    })

    it('checks that the address can be located, with the key being saved', async () => {
        const { save, geocoding } = setup()

        await save(input())

        expect(geocoding.calls).toEqual([
            { address: ADDRESS, apiKey: 'new-key' },
        ])
    })

    it('persists nothing when the address cannot be located', async () => {
        const { save, settings, apiKeys, settingsRepo } = setup({
            geocoding: new FakeGeocodingProvider().failWith('not-found'),
        })

        const result = await save(input())

        expect(result).toEqual({
            ok: false,
            error: { kind: 'geocode-failed', reason: 'not-found' },
        })
        expect(settingsRepo.save).not.toHaveBeenCalled()
        expect(settings.getSnapshot()).toEqual(EMPTY_SETTINGS)
        expect(apiKeys.getSnapshot().geocodeApiKey).toBe('')
    })

    it('saves the key and the settings, and keeps the layout the form does not edit', async () => {
        const layout = [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }]
        const { save, settings, apiKeys } = setup({
            settings: { ...EMPTY_SETTINGS, layout },
        })

        const result = await save(input())

        expect(result).toEqual({ ok: true, value: 'saved' })
        expect(settings.getSnapshot()).toMatchObject({
            address: ADDRESS,
            eventsCalendarId: 'primary',
            birthdayCalendarId: 'bday',
        })
        expect(settings.getSnapshot().layout).toBe(layout)
        expect(apiKeys.getSnapshot().geocodeApiKey).toBe('new-key')
    })

    it('rolls the key back when the settings cannot be written', async () => {
        const { save, apiKeys, keyRepo } = setup({
            keys: { geocodeApiKey: 'old-key' },
            failSettingsWrite: true,
        })

        const result = await save(input())

        expect(result).toEqual({ ok: false, error: { kind: 'storage-failed' } })
        expect(apiKeys.getSnapshot().geocodeApiKey).toBe('old-key')
        expect(keyRepo.saved.at(-1)).toEqual({ geocodeApiKey: 'old-key' })
    })

    it('does not mistake a storage failure for an address that could not be located', async () => {
        const { save } = setup({ failSettingsWrite: true })

        const result = await save(input())

        expect(result).toMatchObject({
            ok: false,
            error: { kind: 'storage-failed' },
        })
    })

    it('does nothing, and does not geocode, when nothing changed (Q7)', async () => {
        const first = setup()
        await first.save(input())
        const { save, geocoding } = setup({
            settings: first.settings.getSnapshot(),
            keys: { geocodeApiKey: 'new-key' },
        })

        const result = await save(input())

        expect(result).toEqual({ ok: true, value: 'unchanged' })
        expect(geocoding.calls).toEqual([])
    })

    it('does not geocode again when only fields other than the address and key change', async () => {
        const first = setup()
        await first.save(input())
        const { save, settings, geocoding } = setup({
            settings: first.settings.getSnapshot(),
            keys: { geocodeApiKey: 'new-key' },
            // An outage must not block saving an unrelated change.
            geocoding: new FakeGeocodingProvider().failWith('network'),
        })

        const result = await save(
            input({
                eventsCalendarId: 'work',
                address: { ...ADDRESS, city: ' Stuttgart ' },
            })
        )

        expect(result).toEqual({ ok: true, value: 'saved' })
        expect(geocoding.calls).toEqual([])
        expect(settings.getSnapshot().eventsCalendarId).toBe('work')
    })

    it('geocodes again when only the key changes', async () => {
        const first = setup()
        await first.save(input())
        const { save, geocoding } = setup({
            settings: first.settings.getSnapshot(),
            keys: { geocodeApiKey: 'new-key' },
        })

        await save(input({ geocodeApiKey: 'other-key' }))

        expect(geocoding.calls).toEqual([
            { address: ADDRESS, apiKey: 'other-key' },
        ])
    })

    it('shares one run between concurrent submissions (double click)', async () => {
        const { save, geocoding } = setup()

        const [first, second] = await Promise.all([
            save(input()),
            save(input()),
        ])

        expect(geocoding.calls).toHaveLength(1)
        expect(first).toEqual(second)
    })
})
