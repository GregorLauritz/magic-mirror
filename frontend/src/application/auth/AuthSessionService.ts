import type { AuthSession } from '@/application/ports/AuthSession'
import type { Clock } from '@/application/ports/Clock'
import {
    AuthFlowError,
    type OAuthTokenGateway,
    type TokenGrant,
} from '@/application/ports/OAuthTokenGateway'
import type { TokenStore } from '@/application/ports/TokenStore'
import { createStore, type Store } from '@/application/support/createStore'
import { singleFlight } from '@/application/support/singleFlight'
import {
    isUsable,
    type AccessTokenResult,
    type AuthFailureReason,
    type AuthState,
    type AuthToken,
} from '@/domain/auth/AuthToken'
import { err, ok, type Result } from '@/domain/shared/Result'
import { instant, type Instant } from '@/domain/shared/time'

export interface AuthSessionConfig {
    /** Renew this long before the token actually expires. */
    readonly refreshMarginMs: number
    /** After a failed renewal, do not ask Google again for this long. */
    readonly refreshCooldownMs: number
}

interface Dependencies {
    readonly gateway: OAuthTokenGateway
    readonly tokens: TokenStore
    readonly clock: Clock
    readonly config: AuthSessionConfig
}

const sameState = (a: AuthState, b: AuthState): boolean =>
    a.status === b.status &&
    ('reason' in a ? a.reason : undefined) ===
        ('reason' in b ? b.reason : undefined) &&
    ('lastError' in a ? a.lastError : undefined) ===
        ('lastError' in b ? b.lastError : undefined)

const reasonOf = (error: unknown): AuthFailureReason =>
    error instanceof AuthFlowError ? error.reason : 'unknown'

/**
 * The signed-in session: token lifecycle, renewal and the state the UI shows.
 *
 * Concurrent renewals share one request and always settle (the legacy flow kept
 * a single "pending" slot, so the first of two simultaneous callers hung
 * forever). A failed renewal keeps the token record, asks the user to sign in
 * again, and pauses silent attempts for a cooldown so a poll does not open a
 * popup every few seconds.
 */
export class AuthSessionService implements AuthSession {
    private readonly store: Store<AuthState>
    readonly getSnapshot: () => AuthState
    readonly subscribe: (listener: () => void) => () => void
    private lastFailure: { reason: AuthFailureReason; at: Instant } | undefined

    private readonly renew = singleFlight(() => this.renewToken())
    private readonly interactiveSignIn = singleFlight(() => this.promptSignIn())

    constructor(private readonly deps: Dependencies) {
        this.store = createStore<AuthState>(
            deps.tokens.load()
                ? { status: 'signed-in' }
                : { status: 'signed-out' },
            sameState
        )
        this.getSnapshot = this.store.getSnapshot
        this.subscribe = this.store.subscribe
    }

    readonly getAccessToken = async (): Promise<AccessTokenResult> => {
        const token = this.deps.tokens.load()
        if (!token) return { status: 'signed-out' }

        const now = this.deps.clock.now()
        if (isUsable(token, now, this.deps.config.refreshMarginMs)) {
            return { status: 'ok', accessToken: token.accessToken }
        }
        const failure = this.lastFailure
        if (failure && now - failure.at < this.deps.config.refreshCooldownMs) {
            return { status: 'refresh-failed', reason: failure.reason }
        }
        return this.renew()
    }

    readonly signIn = (): Promise<Result<void, AuthFailureReason>> =>
        this.interactiveSignIn()

    readonly signOut = async (): Promise<void> => {
        const token = this.deps.tokens.load()
        this.deps.tokens.clear()
        this.lastFailure = undefined
        this.store.set({ status: 'signed-out' })
        if (token)
            await this.deps.gateway
                .revoke(token.accessToken)
                .catch(() => undefined)
    }

    readonly rejectAccessToken = (): void => {
        const token = this.deps.tokens.load()
        if (token)
            this.deps.tokens.save({
                ...token,
                expiresAt: this.deps.clock.now(),
            })
    }

    private async renewToken(): Promise<AccessTokenResult> {
        try {
            const grant = await this.deps.gateway.requestToken('')
            // The user may have signed out while Google was answering.
            if (!this.deps.tokens.load()) return { status: 'signed-out' }
            const token = this.accept(grant)
            return { status: 'ok', accessToken: token.accessToken }
        } catch (error) {
            const reason = reasonOf(error)
            this.lastFailure = { reason, at: this.deps.clock.now() }
            this.store.set({ status: 'needs-reauth', reason })
            return { status: 'refresh-failed', reason }
        }
    }

    private async promptSignIn(): Promise<Result<void, AuthFailureReason>> {
        this.store.set({ status: 'signing-in' })
        try {
            this.accept(await this.deps.gateway.requestToken('consent'))
            return ok(undefined)
        } catch (error) {
            const reason = reasonOf(error)
            this.store.set(
                this.deps.tokens.load()
                    ? { status: 'needs-reauth', reason }
                    : { status: 'signed-out', lastError: reason }
            )
            return err(reason)
        }
    }

    private accept(grant: TokenGrant): AuthToken {
        const token: AuthToken = {
            accessToken: grant.accessToken,
            expiresAt: instant(
                this.deps.clock.now() + grant.expiresInSeconds * 1000
            ),
        }
        this.deps.tokens.save(token)
        this.lastFailure = undefined
        this.store.set({ status: 'signed-in' })
        return token
    }
}
