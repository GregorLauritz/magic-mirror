import { describe, expect, it } from 'vitest'
import { instant } from '@/domain/shared/time'
import { SessionTokenStore } from '@/infrastructure/storage/SessionTokenStore'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'

const setup = (raw?: string) => {
    const store = new InMemoryKeyValueStore()
    if (raw !== undefined) store.set(STORAGE_KEYS.googleToken, raw)
    return { store, tokens: new SessionTokenStore(store) }
}

describe('SessionTokenStore', () => {
    it('uses the storage key of earlier versions', () => {
        expect(STORAGE_KEYS.googleToken).toBe('magic-mirror.google-token')
    })

    it('reads the shape earlier versions wrote', () => {
        const { tokens } = setup(
            '{"accessToken":"abc","expiresAt":1700000000000}'
        )

        expect(tokens.load()).toEqual({
            accessToken: 'abc',
            expiresAt: instant(1700000000000),
        })
    })

    it('has no token when nothing was stored', () => {
        expect(setup().tokens.load()).toBeUndefined()
    })

    it.each([
        ['corrupt JSON', '{nope'],
        ['a JSON string', '"abc"'],
        ['an array', '[]'],
        ['an empty access token', '{"accessToken":"","expiresAt":1}'],
        ['a missing access token', '{"expiresAt":1}'],
        ['a non-numeric expiry', '{"accessToken":"a","expiresAt":"soon"}'],
        ['a non-finite expiry', '{"accessToken":"a","expiresAt":null}'],
    ])('treats %s as no token', (_label, raw) => {
        expect(setup(raw).tokens.load()).toBeUndefined()
    })

    it('saves in the legacy shape and reads it back', () => {
        const { store, tokens } = setup()

        tokens.save({ accessToken: 'abc', expiresAt: instant(5) })

        expect(JSON.parse(store.get(STORAGE_KEYS.googleToken)!)).toEqual({
            accessToken: 'abc',
            expiresAt: 5,
        })
        expect(tokens.load()).toEqual({
            accessToken: 'abc',
            expiresAt: instant(5),
        })
    })

    it('does not throw when the storage is full', () => {
        const { store, tokens } = setup()
        store.failWrites = true

        expect(() =>
            tokens.save({ accessToken: 'abc', expiresAt: instant(5) })
        ).not.toThrow()
    })

    it('removes the token on clear', () => {
        const { store, tokens } = setup('{"accessToken":"abc","expiresAt":1}')

        tokens.clear()

        expect(store.get(STORAGE_KEYS.googleToken)).toBeNull()
    })
})
