import { describe, expect, it, vi } from 'vitest'
import { EMPTY_SETTINGS } from '@/domain/settings/UserSettings'
import {
    CURRENT_SCHEMA_VERSION,
    fromPersisted,
    migrate,
    toPersisted,
} from '@/infrastructure/storage/settingsDto'
import {
    FULL_DOMAIN,
    FULL_RAW,
    LAYOUT_ONLY_RAW,
    NO_DISPLAY_SETTINGS_RAW,
    WRONG_TYPES_RAW,
} from './legacyFixtures'

describe('fromPersisted', () => {
    it('maps a complete legacy blob to the domain model', () => {
        expect(fromPersisted(FULL_RAW)).toEqual(FULL_DOMAIN)
    })

    it('maps an empty blob to the empty settings', () => {
        expect(fromPersisted({})).toEqual(EMPTY_SETTINGS)
    })

    it('reads a layout-only blob: no address, but the layout', () => {
        const settings = fromPersisted(LAYOUT_ONLY_RAW)

        expect(settings.address).toBeUndefined()
        expect(settings.layout).toEqual([
            { widgetId: 'time', x: 0, y: 0, w: 2, h: 1 },
        ])
    })

    it('falls back to the default display settings when they were never saved', () => {
        const settings = fromPersisted(NO_DISPLAY_SETTINGS_RAW)

        expect(settings.trainDisplay).toEqual({
            mode: 'carousel',
            carouselIntervalSeconds: 15,
        })
        expect(settings.address).toEqual({
            country: 'DE',
            city: 'Berlin',
            postalCode: '',
        })
    })

    it.each([null, 'text', 42, [1, 2], undefined, true])(
        'never throws on the non-object %j and yields the empty settings',
        (raw) => {
            expect(fromPersisted(raw)).toEqual(EMPTY_SETTINGS)
        }
    )

    it('ignores fields of the wrong type instead of throwing', () => {
        expect(fromPersisted(WRONG_TYPES_RAW)).toEqual(EMPTY_SETTINGS)
    })

    it('has an address only when a country was saved', () => {
        expect(
            fromPersisted({ city: 'Berlin', zip_code: '10115' }).address
        ).toBeUndefined()
        expect(
            fromPersisted({ country: '', city: 'Berlin' }).address
        ).toBeUndefined()
        expect(fromPersisted({ country: 'DE' }).address).toEqual({
            country: 'DE',
            city: '',
            postalCode: '',
        })
    })

    it('drops train connections without both station ids or without an id', () => {
        const keep = FULL_RAW.train_connections[0]
        const settings = fromPersisted({
            train_connections: [
                keep,
                { ...keep, id: 'x', arrival_station_id: '' },
                { ...keep, id: 'y', departure_station_id: '' },
                { ...keep, id: '' },
                'junk',
                null,
            ],
        })

        expect(settings.trainRoutes.map((r) => r.id)).toEqual(['c1'])
    })

    it('repairs an unknown display mode and an out-of-range interval', () => {
        const settings = fromPersisted({
            train_display_settings: { mode: 'sideways', carousel_interval: 1 },
        })

        expect(settings.trainDisplay).toEqual({
            mode: 'carousel',
            carouselIntervalSeconds: 5,
        })
    })

    it('drops layout entries with non-numeric positions but keeps a present, empty layout', () => {
        const settings = fromPersisted({
            widget_layout: [
                { i: 'ok', x: 0, y: 1, w: 2, h: 1 },
                { i: 'bad', x: 'left', y: 0, w: 2, h: 1 },
                { i: 'nan', x: Number.NaN, y: 0, w: 2, h: 1 },
                { x: 0, y: 0, w: 1, h: 1 },
            ],
        })

        expect(settings.layout).toEqual([
            { widgetId: 'ok', x: 0, y: 1, w: 2, h: 1 },
        ])
        expect(fromPersisted({ widget_layout: [] }).layout).toEqual([])
        expect(fromPersisted({}).layout).toBeUndefined()
    })
})

describe('toPersisted', () => {
    it('writes the legacy snake_case shape, so an older build can still read it', () => {
        expect(toPersisted(FULL_DOMAIN as never, FULL_RAW)).toEqual({
            ...FULL_RAW,
            schema_version: CURRENT_SCHEMA_VERSION,
        })
    })

    it('round-trips a legacy blob through the domain model unchanged', () => {
        const domain = fromPersisted(FULL_RAW)

        expect(fromPersisted(toPersisted(domain, FULL_RAW))).toEqual(domain)
    })

    it('keeps keys it does not know, so nothing is lost on a rollback', () => {
        const written = toPersisted(fromPersisted(FULL_RAW), {
            ...FULL_RAW,
            future_feature: { a: 1 },
        })

        expect(written.future_feature).toEqual({ a: 1 })
    })

    it('adds an additive schema_version', () => {
        expect(toPersisted(EMPTY_SETTINGS, {}).schema_version).toBe(1)
    })

    it('removes a field that the domain no longer has (a reset layout)', () => {
        const withoutLayout = { ...fromPersisted(FULL_RAW), layout: undefined }

        const written = toPersisted(withoutLayout, FULL_RAW)

        expect('widget_layout' in written).toBe(false)
        expect(written.country).toBe('DE')
    })

    it('writes cleanly over a previous value that was not an object', () => {
        expect(toPersisted(EMPTY_SETTINGS, 'garbage')).toEqual({
            schema_version: 1,
            train_connections: [],
            train_display_settings: { mode: 'carousel', carousel_interval: 15 },
        })
    })
})

describe('migrate', () => {
    it('treats a blob without a version as the current version', () => {
        expect(migrate({ country: 'DE' })).toEqual({
            raw: { country: 'DE' },
            from: 1,
        })
    })

    it('runs the ordered migrations from the stored version up to the current one', () => {
        const to2 = vi.fn((raw: Record<string, unknown>) => ({
            ...raw,
            renamed: raw.old,
        }))
        const to3 = vi.fn((raw: Record<string, unknown>) => ({
            ...raw,
            third: true,
        }))

        const result = migrate(
            { schema_version: 1, old: 'x' },
            { 1: to2, 2: to3 },
            3
        )

        expect(to2).toHaveBeenCalledTimes(1)
        expect(to3).toHaveBeenCalledTimes(1)
        expect(result.from).toBe(1)
        expect(result.raw).toMatchObject({ renamed: 'x', third: true })
    })

    it('does not rewrite a blob from a newer version it does not understand', () => {
        const migration = vi.fn()

        const result = migrate(
            { schema_version: 9, keep: true },
            { 1: migration },
            2
        )

        expect(migration).not.toHaveBeenCalled()
        expect(result.raw).toEqual({ schema_version: 9, keep: true })
    })
})
