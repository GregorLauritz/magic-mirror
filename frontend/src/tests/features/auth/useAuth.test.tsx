import { describe, expect, it } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { describeAuthFailure, useAuth } from '@/features/auth'
import type { AuthFailureReason } from '@/domain/auth/AuthToken'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { FakeOAuthGateway } from '../../support/FakeOAuthGateway'
import { renderHookWithDeps } from '../../support/renderWithDeps'

describe('useAuth', () => {
    it.each([
        [
            { status: 'signed-out' },
            { isSignedIn: false, isSigningIn: false, needsReauth: false },
        ],
        [
            { status: 'signing-in' },
            { isSignedIn: false, isSigningIn: true, needsReauth: false },
        ],
        [
            { status: 'signed-in' },
            { isSignedIn: true, isSigningIn: false, needsReauth: false },
        ],
        [
            { status: 'needs-reauth', reason: 'timeout' },
            { isSignedIn: false, isSigningIn: false, needsReauth: true },
        ],
    ] as const)('derives the flags from the state %j', (state, expected) => {
        const test = createTestContainer({
            authSession: new FakeAuthSession(state),
        })

        const { result } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
        })

        expect(result.current).toMatchObject(expected)
    })

    it('re-renders when the auth state changes', () => {
        const auth = new FakeAuthSession({ status: 'signed-out' })
        const test = createTestContainer({ authSession: auth })
        const { result } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
        })

        act(() => auth.setState({ status: 'signed-in' }))

        expect(result.current.isSignedIn).toBe(true)
    })

    it('keeps one live subscription under StrictMode', () => {
        const auth = new FakeAuthSession({ status: 'signed-out' })
        const test = createTestContainer({ authSession: auth })
        const { result, unmount } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
            strict: true,
        })

        act(() => auth.setState({ status: 'signed-in' }))
        expect(result.current.isSignedIn).toBe(true)

        unmount()
        expect(() =>
            act(() => auth.setState({ status: 'signed-out' }))
        ).not.toThrow()
    })

    it('hands out stable actions, so they are safe in effect dependencies', () => {
        const test = createTestContainer({ authSession: new FakeAuthSession() })
        const { result, rerender } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
        })
        const { signIn, signOut } = result.current

        rerender()

        expect(result.current.signIn).toBe(signIn)
        expect(result.current.signOut).toBe(signOut)
    })

    it('shows no error while signed in or signing in', () => {
        const test = createTestContainer({ authSession: new FakeAuthSession() })

        const { result } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
        })

        expect(result.current.error).toBeUndefined()
    })

    it('recovers from a closed sign-in popup instead of staying "signing in" (B2)', async () => {
        const gateway = new FakeOAuthGateway()
        const test = createTestContainer({ oauthGateway: gateway })
        const { result } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
        })

        act(() => {
            void result.current.signIn()
        })
        expect(result.current.isSigningIn).toBe(true)
        act(() => gateway.fail('popup_closed'))

        await waitFor(() => expect(result.current.isSigningIn).toBe(false))
        expect(result.current.isSignedIn).toBe(false)
        expect(result.current.error).toBe(describeAuthFailure('popup_closed'))
    })

    it('signs in end to end through the container', async () => {
        const gateway = new FakeOAuthGateway()
        const test = createTestContainer({ oauthGateway: gateway })
        const { result } = renderHookWithDeps(() => useAuth(), {
            deps: test.deps,
        })

        act(() => {
            void result.current.signIn()
        })
        act(() => gateway.grant('tok'))

        await waitFor(() => expect(result.current.isSignedIn).toBe(true))
        expect(result.current.error).toBeUndefined()
    })
})

describe('describeAuthFailure', () => {
    const REASONS: AuthFailureReason[] = [
        'access_denied',
        'popup_closed',
        'popup_blocked',
        'script_unavailable',
        'timeout',
        'unknown',
    ]

    it('gives every reason its own readable message', () => {
        const messages = REASONS.map(describeAuthFailure)

        expect(new Set(messages).size).toBe(REASONS.length)
        for (const message of messages) expect(message.trim()).not.toBe('')
    })

    it('tells the user how to fix a blocked popup', () => {
        expect(describeAuthFailure('popup_blocked')).toMatch(/pop-up/i)
    })
})
