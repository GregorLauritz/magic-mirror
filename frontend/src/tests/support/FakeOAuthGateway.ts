import {
    AuthFlowError,
    type OAuthTokenGateway,
    type TokenPrompt,
} from '@/application/ports/OAuthTokenGateway'
import type { AuthFailureReason } from '@/domain/auth/AuthToken'

interface Pending {
    resolve: (grant: { accessToken: string; expiresInSeconds: number }) => void
    reject: (error: unknown) => void
}

/** OAuthTokenGateway whose outcome the test decides, one request at a time. */
export class FakeOAuthGateway implements OAuthTokenGateway {
    warmUps = 0
    readonly requests: TokenPrompt[] = []
    readonly revoked: string[] = []
    revokeFails = false
    private pending: Pending[] = []

    warmUp(): void {
        this.warmUps++
    }

    requestToken(prompt: TokenPrompt) {
        this.requests.push(prompt)
        return new Promise<{ accessToken: string; expiresInSeconds: number }>(
            (resolve, reject) => {
                this.pending.push({ resolve, reject })
            }
        )
    }

    async revoke(accessToken: string): Promise<void> {
        this.revoked.push(accessToken)
        if (this.revokeFails) throw new Error('revoke failed')
    }

    grant(accessToken = 'fresh-token', expiresInSeconds = 3600): void {
        for (const { resolve } of this.pending.splice(0))
            resolve({ accessToken, expiresInSeconds })
    }

    fail(reason: AuthFailureReason): void {
        for (const { reject } of this.pending.splice(0))
            reject(new AuthFlowError(reason))
    }
}
