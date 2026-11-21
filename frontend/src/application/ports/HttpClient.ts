export interface HttpRequest {
    readonly url: string
    readonly headers?: Readonly<Record<string, string>>
    /** Caller-side cancellation (react-query passes one per query). */
    readonly signal?: AbortSignal
    /** Overrides the client default for this request. */
    readonly timeoutMs?: number
    /** ADDITIONAL attempts after the first; overrides the client default. */
    readonly retries?: number
}

/**
 * Outbound JSON GET. Resolves with the parsed body of a 2xx response and
 * rejects with HttpError / NetworkError / TimeoutError / ProviderResponseError
 * (see ./errors). Only transient failures are retried, never 4xx.
 */
export interface HttpClient {
    getJson<T = unknown>(request: HttpRequest): Promise<T>
}
