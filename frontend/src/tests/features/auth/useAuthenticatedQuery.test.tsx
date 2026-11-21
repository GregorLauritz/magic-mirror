import { describe, expect, it, vi } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { AuthRequiredError } from '@/application/ports/errors'
import { useAccessToken, useAuthenticatedQuery } from '@/features/auth'
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
})

describe('useAccessToken (transitional bridge for the legacy Google calls)', () => {
    it('yields the access token', async () => {
        const test = createTestContainer({ authSession: new FakeAuthSession() })
        const { result } = renderHookWithDeps(() => useAccessToken(), {
            deps: test.deps,
        })

        await expect(result.current()).resolves.toBe('fake-token')
    })

    it.each([
        [{ status: 'signed-out' }, 'signed-out'],
        [{ status: 'refresh-failed', reason: 'timeout' }, 'refresh-failed'],
    ] as const)(
        'throws AuthRequiredError when the result is %j',
        async (tokenResult, reason) => {
            const auth = new FakeAuthSession()
            auth.tokenResult = tokenResult
            const test = createTestContainer({ authSession: auth })
            const { result } = renderHookWithDeps(() => useAccessToken(), {
                deps: test.deps,
            })

            const failure = await result
                .current()
                .catch((error: unknown) => error)

            expect(failure).toBeInstanceOf(AuthRequiredError)
            expect(failure).toMatchObject({ reason })
        }
    )
})
