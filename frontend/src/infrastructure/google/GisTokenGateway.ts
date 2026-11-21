import type { Scheduler } from '@/application/ports/Scheduler'
import {
    AuthFlowError,
    type OAuthTokenGateway,
    type TokenGrant,
    type TokenPrompt,
} from '@/application/ports/OAuthTokenGateway'
import type { AuthFailureReason } from '@/domain/auth/AuthToken'

type GoogleAccounts = NonNullable<Window['google']>

export interface GisTokenGatewayOptions {
    /** Read lazily: the GIS script may load after startup. */
    readonly getGoogle: () => GoogleAccounts | undefined
    readonly clientId: string
    readonly scope: string
    readonly scheduler: Scheduler
    readonly timeouts: {
        /** How long to wait for the GIS script itself. */
        readonly loadMs: number
        /** How long the user gets to finish the consent popup. */
        readonly interactiveMs: number
        /** How long a silent renewal (and a revoke) may take. */
        readonly silentMs: number
    }
}

interface InFlight {
    readonly promise: Promise<TokenGrant>
    readonly resolve: (grant: TokenGrant) => void
    readonly reject: (error: AuthFlowError) => void
}

const POLL_INTERVAL_MS = 100
const DEFAULT_LIFETIME_SECONDS = 3600

const popupFailure = (type: GoogleTokenError['type']): AuthFailureReason => {
    if (type === 'popup_closed') return 'popup_closed'
    if (type === 'popup_failed_to_open') return 'popup_blocked'
    return 'unknown'
}

/**
 * Google Identity Services behind the OAuthTokenGateway port.
 *
 * GIS has one callback, fixed when the client is created, and serves one request
 * at a time. This adapter therefore owns exactly one in-flight request that
 * overlapping callers share, maps both of GIS's failure channels (`callback`
 * with an error, and `error_callback` for popups) to typed errors, and bounds
 * every request with a timeout, so nothing can hang. The client is created ahead
 * of time (`warmUp`) so that a click can call `requestAccessToken` synchronously:
 * any `await` in between can make the browser block the popup.
 */
export class GisTokenGateway implements OAuthTokenGateway {
    private client: GoogleTokenClient | undefined
    private loading: Promise<GoogleTokenClient> | undefined
    private inFlight: InFlight | undefined

    constructor(private readonly options: GisTokenGatewayOptions) {}

    warmUp(): void {
        if (this.client || this.tryCreateClient()) return
        // A failed load is not remembered, so a later request can try again.
        this.load().catch(() => undefined)
    }

    requestToken(prompt: TokenPrompt): Promise<TokenGrant> {
        if (this.inFlight) return this.inFlight.promise
        const client = this.client ?? this.tryCreateClient()
        if (client) return this.start(client, prompt)
        return this.load().then((loaded) => this.start(loaded, prompt))
    }

    revoke(accessToken: string): Promise<void> {
        return new Promise((resolve) => {
            const google = this.options.getGoogle()
            if (!google) return resolve()
            const cancel = this.options.scheduler.setTimeout(
                resolve,
                this.options.timeouts.silentMs
            )
            try {
                google.accounts.oauth2.revoke(accessToken, () => {
                    cancel()
                    resolve()
                })
            } catch {
                cancel()
                resolve()
            }
        })
    }

    private tryCreateClient(): GoogleTokenClient | undefined {
        const google = this.options.getGoogle()
        if (!google) return undefined
        this.client = google.accounts.oauth2.initTokenClient({
            client_id: this.options.clientId,
            scope: this.options.scope,
            callback: (response) => this.onResponse(response),
            error_callback: (error) => this.fail(popupFailure(error.type)),
        })
        return this.client
    }

    private load(): Promise<GoogleTokenClient> {
        this.loading ??= new Promise<GoogleTokenClient>((resolve, reject) => {
            const maxPolls = Math.ceil(
                this.options.timeouts.loadMs / POLL_INTERVAL_MS
            )
            let polls = 0
            const poll = () => {
                const client = this.client ?? this.tryCreateClient()
                if (client) return resolve(client)
                if (++polls >= maxPolls)
                    return reject(new AuthFlowError('script_unavailable'))
                this.options.scheduler.setTimeout(poll, POLL_INTERVAL_MS)
            }
            this.options.scheduler.setTimeout(poll, POLL_INTERVAL_MS)
        }).finally(() => {
            this.loading = undefined
        })
        return this.loading
    }

    private start(
        client: GoogleTokenClient,
        prompt: TokenPrompt
    ): Promise<TokenGrant> {
        if (this.inFlight) return this.inFlight.promise

        let resolve!: InFlight['resolve']
        let reject!: InFlight['reject']
        const promise = new Promise<TokenGrant>((res, rej) => {
            resolve = res
            reject = rej
        })
        const timeoutMs =
            prompt === 'consent'
                ? this.options.timeouts.interactiveMs
                : this.options.timeouts.silentMs
        const cancelTimeout = this.options.scheduler.setTimeout(
            () => this.fail('timeout'),
            timeoutMs
        )
        const settle = () => {
            cancelTimeout()
            this.inFlight = undefined
        }
        this.inFlight = {
            promise,
            resolve: (grant) => {
                settle()
                resolve(grant)
            },
            reject: (error) => {
                settle()
                reject(error)
            },
        }

        try {
            client.requestAccessToken({ prompt })
        } catch {
            this.fail('unknown')
        }
        return promise
    }

    private onResponse(response: GoogleTokenResponse): void {
        if (response.error) {
            this.fail(
                response.error === 'access_denied' ? 'access_denied' : 'unknown'
            )
        } else if (response.access_token) {
            this.inFlight?.resolve({
                accessToken: response.access_token,
                expiresInSeconds:
                    response.expires_in ?? DEFAULT_LIFETIME_SECONDS,
            })
        } else {
            this.fail('unknown')
        }
    }

    private fail(reason: AuthFailureReason): void {
        this.inFlight?.reject(new AuthFlowError(reason))
    }
}
