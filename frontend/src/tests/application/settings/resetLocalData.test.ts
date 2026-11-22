import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from 'react-query'
import { createResetLocalData } from '@/application/settings/resetLocalData'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { FakeAppLifecycle } from '../../support/FakeAppLifecycle'

const seed = () => {
    const local = new InMemoryKeyValueStore()
    local.set('magic-mirror.user-settings', '{"country":"DE"}')
    local.set('magic-mirror.api-keys', '{"geocodeApiKey":"k"}')
    local.set('someone-elses-key', 'keep me')
    const session = new InMemoryKeyValueStore()
    session.set('magic-mirror.google-token', '{"accessToken":"t"}')
    session.set('other-app', 'keep me too')
    return { local, session }
}

describe('resetLocalData (B5: the token and the cache survived "Clear Local Data")', () => {
    it('removes every magic-mirror key from both storages and leaves foreign keys alone', async () => {
        const { local, session } = seed()
        const reset = createResetLocalData({
            stores: [local, session],
            prefix: 'magic-mirror.',
            reload: [],
            clearCache: () => {},
            lifecycle: new FakeAppLifecycle(),
            signOut: async () => {},
        })

        await reset()

        expect(local.keys()).toEqual(['someone-elses-key'])
        expect(session.keys()).toEqual(['other-app']) // the Google token is gone
    })

    it('clears the query cache, so no account data stays in memory', async () => {
        const queryClient = new QueryClient()
        queryClient.setQueryData(['google', 'events'], ['private event'])
        const { local, session } = seed()

        await createResetLocalData({
            stores: [local, session],
            prefix: 'magic-mirror.',
            reload: [],
            clearCache: () => queryClient.clear(),
            lifecycle: new FakeAppLifecycle(),
            signOut: async () => {},
        })()

        expect(queryClient.getQueryData(['google', 'events'])).toBeUndefined()
    })

    it('reloads the in-memory stores from the now-empty storage', async () => {
        const { local, session } = seed()
        const reloadStores = vi.fn()

        await createResetLocalData({
            stores: [local, session],
            prefix: 'magic-mirror.',
            reload: [reloadStores],
            clearCache: () => {},
            lifecycle: new FakeAppLifecycle(),
            signOut: async () => {},
        })()

        expect(reloadStores).toHaveBeenCalledTimes(1)
    })

    it('reloads the app last, after everything else was cleared', async () => {
        const { local, session } = seed()
        const lifecycle = new FakeAppLifecycle()
        const keysAtReload: number[] = []
        lifecycle.reload = () =>
            keysAtReload.push(local.keys().length + session.keys().length)

        await createResetLocalData({
            stores: [local, session],
            prefix: 'magic-mirror.',
            reload: [],
            clearCache: () => {},
            lifecycle,
            signOut: async () => {},
        })()

        expect(keysAtReload).toEqual([2]) // only the two foreign keys remained
    })

    it('signs out first, while the token is still stored, so it can be revoked at Google', async () => {
        const { local, session } = seed()
        const seenAtSignOut: string[] = []

        await createResetLocalData({
            stores: [local, session],
            prefix: 'magic-mirror.',
            reload: [],
            clearCache: () => {},
            lifecycle: new FakeAppLifecycle(),
            signOut: async () => {
                seenAtSignOut.push(...session.keys())
            },
        })()

        expect(seenAtSignOut).toContain('magic-mirror.google-token')
        expect(session.keys()).toEqual(['other-app'])
    })
})
