import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthSessionService } from '@/application/auth/AuthSessionService'
import { instant } from '@/domain/shared/time'
import { FakeClock } from '../../support/FakeClock'
import { FakeOAuthGateway } from '../../support/FakeOAuthGateway'
import { InMemoryTokenStore } from '../../support/InMemoryTokenStore'

const MARGIN = 60_000
const COOLDOWN = 300_000
const NOW = Date.parse('2024-01-15T12:00:00Z')

describe('AuthSessionService', () => {
    let clock: FakeClock
    let gateway: FakeOAuthGateway
    let tokens: InMemoryTokenStore

    beforeEach(() => {
        clock = new FakeClock(NOW)
        gateway = new FakeOAuthGateway()
        tokens = new InMemoryTokenStore()
    })

    const service = () =>
        new AuthSessionService({
            gateway,
            tokens,
            clock,
            config: { refreshMarginMs: MARGIN, refreshCooldownMs: COOLDOWN },
        })
    const validToken = () => ({
        accessToken: 'valid',
        expiresAt: instant(NOW + 3_600_000),
    })
    const expiredToken = () => ({
        accessToken: 'stale',
        expiresAt: instant(NOW - 1000),
    })
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

    describe('state', () => {
        it('is signed out without a stored token', () => {
            expect(service().getSnapshot()).toEqual({ status: 'signed-out' })
        })

        it('is signed in while a token record exists, even an expired one', () => {
            // The record is what makes a silent refresh possible; treating an
            // expired token as "signed out" would stop anything from refreshing it.
            tokens.token = expiredToken()

            expect(service().getSnapshot()).toEqual({ status: 'signed-in' })
        })
    })

    describe('getAccessToken', () => {
        it('reports signed-out without touching Google when there is no token', async () => {
            await expect(service().getAccessToken()).resolves.toEqual({
                status: 'signed-out',
            })
            expect(gateway.requests).toEqual([])
        })

        it('returns a usable token as is', async () => {
            tokens.token = validToken()

            await expect(service().getAccessToken()).resolves.toEqual({
                status: 'ok',
                accessToken: 'valid',
            })
            expect(gateway.requests).toEqual([])
        })

        it('treats a token inside the safety margin as expired', async () => {
            tokens.token = {
                accessToken: 'almost',
                expiresAt: instant(NOW + MARGIN - 1),
            }
            const auth = service()

            const result = auth.getAccessToken()
            await settle()
            gateway.grant('renewed')

            await expect(result).resolves.toEqual({
                status: 'ok',
                accessToken: 'renewed',
            })
        })

        it('refreshes an expired token silently and stores the new one', async () => {
            tokens.token = expiredToken()
            const auth = service()

            const result = auth.getAccessToken()
            await settle()
            expect(gateway.requests).toEqual(['']) // silent: no consent prompt
            gateway.grant('renewed', 1800)

            await expect(result).resolves.toEqual({
                status: 'ok',
                accessToken: 'renewed',
            })
            expect(tokens.token).toEqual({
                accessToken: 'renewed',
                expiresAt: instant(NOW + 1_800_000),
            })
            expect(auth.getSnapshot()).toEqual({ status: 'signed-in' })
        })

        it('shares ONE refresh between concurrent callers, and all of them resolve (B2)', async () => {
            // The legacy code kept a single "pending" slot, so the first caller
            // hung forever once a second one arrived.
            tokens.token = expiredToken()
            const auth = service()

            const first = auth.getAccessToken()
            const second = auth.getAccessToken()
            const third = auth.getAccessToken()
            await settle()
            gateway.grant('renewed')

            const expected = { status: 'ok', accessToken: 'renewed' }
            await expect(Promise.all([first, second, third])).resolves.toEqual([
                expected,
                expected,
                expected,
            ])
            expect(gateway.requests).toHaveLength(1)
        })

        it('reports a closed popup as a failure instead of hanging (B2)', async () => {
            tokens.token = expiredToken()
            const auth = service()

            const result = auth.getAccessToken()
            await settle()
            gateway.fail('popup_closed')

            await expect(result).resolves.toEqual({
                status: 'refresh-failed',
                reason: 'popup_closed',
            })
        })

        it('keeps the token record and asks for a fresh sign-in after a failed refresh', async () => {
            tokens.token = expiredToken()
            const auth = service()

            const result = auth.getAccessToken()
            await settle()
            gateway.fail('timeout')
            await result

            expect(tokens.token).toEqual(expiredToken())
            expect(auth.getSnapshot()).toEqual({
                status: 'needs-reauth',
                reason: 'timeout',
            })
        })

        it('does not ask Google again during the cooldown (no popup spam on every poll)', async () => {
            tokens.token = expiredToken()
            const auth = service()
            const first = auth.getAccessToken()
            await settle()
            gateway.fail('popup_closed')
            await first

            clock.advance(COOLDOWN - 1)
            const again = await auth.getAccessToken()

            expect(again).toEqual({
                status: 'refresh-failed',
                reason: 'popup_closed',
            })
            expect(gateway.requests).toHaveLength(1)
        })

        it('tries again once the cooldown has passed', async () => {
            tokens.token = expiredToken()
            const auth = service()
            const first = auth.getAccessToken()
            await settle()
            gateway.fail('popup_closed')
            await first

            clock.advance(COOLDOWN)
            const retry = auth.getAccessToken()
            await settle()
            gateway.grant('back')

            await expect(retry).resolves.toEqual({
                status: 'ok',
                accessToken: 'back',
            })
            expect(gateway.requests).toHaveLength(2)
        })
    })

    it('does not bring the session back when the user signed out while a renewal was in flight', async () => {
        tokens.token = expiredToken()
        const auth = service()
        const pending = auth.getAccessToken()
        await settle()

        await auth.signOut()
        gateway.grant('arrives-too-late')

        await expect(pending).resolves.toEqual({ status: 'signed-out' })
        expect(tokens.token).toBeUndefined()
        expect(auth.getSnapshot()).toEqual({ status: 'signed-out' })
    })

    describe('signIn', () => {
        it('asks for consent, stores the token and signs in', async () => {
            const auth = service()
            const listener = vi.fn()
            auth.subscribe(listener)

            const result = auth.signIn()
            expect(auth.getSnapshot()).toEqual({ status: 'signing-in' })
            expect(gateway.requests).toEqual(['consent'])
            gateway.grant('signed-in-token')

            await expect(result).resolves.toEqual({
                ok: true,
                value: undefined,
            })
            expect(tokens.token?.accessToken).toBe('signed-in-token')
            expect(auth.getSnapshot()).toEqual({ status: 'signed-in' })
            expect(listener).toHaveBeenCalled()
        })

        it('returns to signed-out with the reason when the user closes the popup (B2)', async () => {
            const auth = service()

            const result = auth.signIn()
            gateway.fail('popup_closed')

            await expect(result).resolves.toEqual({
                ok: false,
                error: 'popup_closed',
            })
            expect(auth.getSnapshot()).toEqual({
                status: 'signed-out',
                lastError: 'popup_closed',
            })
        })

        it('keeps asking for re-authentication when a failed sign-in follows an earlier session', async () => {
            tokens.token = expiredToken()
            const auth = service()

            const result = auth.signIn()
            gateway.fail('access_denied')
            await result

            expect(auth.getSnapshot()).toEqual({
                status: 'needs-reauth',
                reason: 'access_denied',
            })
        })

        it('shares one prompt between concurrent clicks', async () => {
            const auth = service()

            const first = auth.signIn()
            const second = auth.signIn()
            gateway.grant()

            expect(first).toBe(second)
            await first
            expect(gateway.requests).toHaveLength(1)
        })

        it('clears the refresh cooldown, so a manual sign-in always goes through', async () => {
            tokens.token = expiredToken()
            const auth = service()
            const failed = auth.getAccessToken()
            await settle()
            gateway.fail('popup_closed')
            await failed

            const signIn = auth.signIn()
            gateway.grant('manual')
            await signIn

            await expect(auth.getAccessToken()).resolves.toEqual({
                status: 'ok',
                accessToken: 'manual',
            })
        })
    })

    describe('signOut', () => {
        it('forgets the token, signs out and revokes the token at Google', async () => {
            tokens.token = validToken()
            const auth = service()

            await auth.signOut()

            expect(tokens.token).toBeUndefined()
            expect(auth.getSnapshot()).toEqual({ status: 'signed-out' })
            expect(gateway.revoked).toEqual(['valid'])
        })

        it('is signed out locally even if the revocation fails', async () => {
            tokens.token = validToken()
            gateway.revokeFails = true
            const auth = service()

            await expect(auth.signOut()).resolves.toBeUndefined()

            expect(auth.getSnapshot()).toEqual({ status: 'signed-out' })
        })

        it('does not call Google when nobody was signed in', async () => {
            await service().signOut()

            expect(gateway.revoked).toEqual([])
        })
    })

    describe('rejectAccessToken', () => {
        it('makes the next request refresh, although the expiry is still in the future', async () => {
            tokens.token = validToken()
            const auth = service()

            auth.rejectAccessToken() // Google answered 401: the token was revoked
            const result = auth.getAccessToken()
            await settle()
            expect(gateway.requests).toEqual([''])
            gateway.grant('replacement')

            await expect(result).resolves.toEqual({
                status: 'ok',
                accessToken: 'replacement',
            })
        })
    })

    it('keeps the state snapshot referentially stable while nothing changes', () => {
        const auth = service()

        expect(auth.getSnapshot()).toBe(auth.getSnapshot())
    })

    it('lets a subscriber unsubscribe', async () => {
        const auth = service()
        const listener = vi.fn()
        const unsubscribe = auth.subscribe(listener)

        unsubscribe()
        const result = auth.signIn()
        gateway.grant()
        await result

        expect(listener).not.toHaveBeenCalled()
    })
})
