// Typed failures of the outbound ports. Adapters translate whatever the
// platform throws into these, so callers can decide what is worth retrying
// without knowing about fetch or DOM exceptions.

/**
 * Strips the query string (and fragment). Query strings carry API keys
 * (e.g. geocode.maps.co?api_key=...), which must never reach logs or the UI.
 */
export const redactUrl = (url: string): string => url.split(/[?#]/)[0]

export class HttpError extends Error {
    readonly url: string

    constructor(
        readonly status: number,
        url: string
    ) {
        const safeUrl = redactUrl(url)
        super(`HTTP ${status} for ${safeUrl}`)
        this.name = 'HttpError'
        this.url = safeUrl
    }
}

export class NetworkError extends Error {
    constructor(message = 'Network request failed', options?: ErrorOptions) {
        super(message, options)
        this.name = 'NetworkError'
    }
}

export class TimeoutError extends Error {
    constructor(message = 'Request timed out') {
        super(message)
        this.name = 'TimeoutError'
    }
}

/** The upstream answered, but not with the shape we can use. */
export class ProviderResponseError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'ProviderResponseError'
    }
}

/** True for failures a second attempt can plausibly fix. */
export const isRetryable = (error: unknown): boolean =>
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    (error instanceof HttpError &&
        (error.status >= 500 || error.status === 429))
