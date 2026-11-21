import { describe, expect, it, vi } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { googleQueryKey, useAuthenticatedQuery } from '@/features/auth'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const setup = (auth: FakeAuthSession, enabled?: boolean) => {
    const test = createTestContainer({ authSession: auth })
    const fn = vi.fn().mockResolvedValue('data')
    const rendered = renderHookWithDeps(
        () => useAuthenticatedQuery(['probe'], fn, { enabled }),
        { deps: test.deps }
    )
    return { ...rendered, fn, test }
}

describe('useAuthenticatedQuery', () => {
    it('fetches once signed in', async () => {
        const { result, fn } = setup(
            new FakeAuthSession({ status: 'signed-in' })
        )

        await waitFor(() => expect(result.current.data).toBe('data'))
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it.each([{ status: 'signed-out' }, { status: 'signing-in' }] as const)(
        'does not fetch while the state is %j',
        async (state) => {
            const { fn } = setup(new FakeAuthSession(state))

            await new Promise((resolve) => setTimeout(resolve, 20))

            expect(fn).not.toHaveBeenCalled()
        }
    )

    it('keeps fetching when a refresh failed, so a kiosk can recover on its own', async () => {
        const { result, fn } = setup(
            new FakeAuthSession({
                status: 'needs-reauth',
                reason: 'popup_closed',
            })
        )

        await waitFor(() => expect(result.current.data).toBe('data'))
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('starts fetching when the user signs in', async () => {
        const auth = new FakeAuthSession({ status: 'signed-out' })
        const { result, fn } = setup(auth)
        expect(fn).not.toHaveBeenCalled()

        act(() => auth.setState({ status: 'signed-in' }))

        await waitFor(() => expect(result.current.data).toBe('data'))
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('can be switched off by the caller', async () => {
        const { fn } = setup(new FakeAuthSession(), false)

        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(fn).not.toHaveBeenCalled()
    })

    it('stores its data under the "google" key, so signing out can purge it', async () => {
        const { result, test } = setup(new FakeAuthSession())
        await waitFor(() => expect(result.current.data).toBe('data'))

        expect(test.deps.queryClient.getQueryData(['google', 'probe'])).toBe(
            'data'
        )
    })

    it('hands the abort signal to the fetcher', async () => {
        const { result, fn } = setup(new FakeAuthSession())
        await waitFor(() => expect(result.current.data).toBe('data'))

        expect(fn.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal)
    })

    it('exposes the key it stores under, so callers can invalidate their own queries', async () => {
        const { result, test } = setup(new FakeAuthSession())
        await waitFor(() => expect(result.current.data).toBe('data'))

        expect(
            test.deps.queryClient.getQueryData(googleQueryKey(['probe']))
        ).toBe('data')
    })

    // Mount the same query twice and count the calls: a fresh answer is served
    // from the cache, a stale one is fetched again.
    const countCallsOnSecondMount = async (
        appWideStaleTimeMs: number,
        options?: { staleTimeMs?: number }
    ) => {
        const test = createTestContainer({ authSession: new FakeAuthSession() })
        test.deps.queryClient.setDefaultOptions({
            queries: { staleTime: appWideStaleTimeMs, cacheTime: 60_000 },
        })
        const fn = vi.fn().mockResolvedValue('data')
        const mount = () =>
            renderHookWithDeps(
                () => useAuthenticatedQuery(['probe'], fn, options),
                { deps: test.deps }
            )
        const first = mount()
        await waitFor(() => expect(first.result.current.data).toBe('data'))
        first.unmount()

        mount()
        await new Promise((resolve) => setTimeout(resolve, 20))
        return fn.mock.calls.length
    }

    it('keeps the app-wide stale time unless the caller sets one (an explicit undefined would reset it to 0)', async () => {
        expect(await countCallsOnSecondMount(60_000)).toBe(1)
    })

    it('uses the stale time the caller gives', async () => {
        expect(await countCallsOnSecondMount(0, { staleTimeMs: 60_000 })).toBe(
            1
        )
    })

    it('refetches a stale answer on the next mount', async () => {
        expect(await countCallsOnSecondMount(0)).toBe(2)
    })
})
