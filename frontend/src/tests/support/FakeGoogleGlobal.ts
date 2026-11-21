/** A stand-in for window.google (Google Identity Services) that the test drives. */
export class FakeGoogleGlobal {
    readonly initConfigs: GoogleTokenClientConfig[] = []
    readonly requests: Array<{ prompt?: string }> = []
    readonly revoked: string[] = []
    /** Set to false to simulate Google never calling the revoke callback back. */
    answersRevoke = true
    throwOnRevoke = false

    readonly google: NonNullable<Window['google']> = {
        accounts: {
            oauth2: {
                initTokenClient: (config) => {
                    this.initConfigs.push(config)
                    return {
                        requestAccessToken: (overrideConfig) => {
                            this.requests.push(overrideConfig ?? {})
                        },
                    }
                },
                revoke: (accessToken, done) => {
                    if (this.throwOnRevoke) throw new Error('revoke blew up')
                    this.revoked.push(accessToken)
                    if (this.answersRevoke) done()
                },
            },
        },
    }

    private get config(): GoogleTokenClientConfig {
        return this.initConfigs[this.initConfigs.length - 1]
    }

    /** Google answers the pending token request. */
    respond(response: GoogleTokenResponse): void {
        this.config.callback(response)
    }

    /** The popup was closed, blocked or failed. */
    popupError(type: GoogleTokenError['type']): void {
        this.config.error_callback?.({ type })
    }
}
