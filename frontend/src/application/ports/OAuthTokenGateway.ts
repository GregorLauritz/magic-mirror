import type { AuthFailureReason } from '@/domain/auth/AuthToken'

/** `consent` asks the user; the empty prompt tries to renew silently. */
export type TokenPrompt = 'consent' | ''

export interface TokenGrant {
    readonly accessToken: string
    readonly expiresInSeconds: number
}

export class AuthFlowError extends Error {
    constructor(
        readonly reason: AuthFailureReason,
        message: string = reason
    ) {
        super(message)
        this.name = 'AuthFlowError'
    }
}

/**
 * Access to the OAuth provider (Google Identity Services). Overlapping calls
 * share one request; failures reject with AuthFlowError, never hang.
 */
export interface OAuthTokenGateway {
    /** Loads the provider ahead of the first click so a popup is not blocked. */
    warmUp(): void
    requestToken(prompt: TokenPrompt): Promise<TokenGrant>
    /** Best effort: never rejects. */
    revoke(accessToken: string): Promise<void>
}
