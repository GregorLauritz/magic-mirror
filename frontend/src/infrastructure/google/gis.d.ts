// Minimal typing for the part of Google Identity Services (GIS) used by
// GisTokenGateway. GIS is loaded with a <script> tag (see index.html), not an npm
// package, so there is no upstream definition to depend on.
export {}

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (
                        config: GoogleTokenClientConfig
                    ) => GoogleTokenClient
                    revoke: (accessToken: string, done: () => void) => void
                }
            }
        }
    }

    interface GoogleTokenClientConfig {
        client_id: string
        scope: string
        callback: (response: GoogleTokenResponse) => void
        /** Popup closed, blocked or failed to open. Without it these are silent. */
        error_callback?: (error: GoogleTokenError) => void
    }

    interface GoogleTokenClient {
        requestAccessToken: (overrideConfig?: { prompt?: string }) => void
    }

    interface GoogleTokenResponse {
        access_token?: string
        expires_in?: number
        error?: string
    }

    interface GoogleTokenError {
        type: 'popup_closed' | 'popup_failed_to_open' | 'unknown'
        message?: string
    }
}
