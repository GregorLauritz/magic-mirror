import type { Scheduler } from '@/application/ports/Scheduler'
import type { HttpClient, HttpRequest } from '@/application/ports/HttpClient'
import {
    HttpError,
    NetworkError,
    ProviderResponseError,
    TimeoutError,
    isRetryable,
    redactUrl,
} from '@/application/ports/errors'

export interface FetchHttpClientOptions {
    readonly scheduler: Scheduler
    readonly timeoutMs: number
    /** Additional attempts after the first (network, timeout, 5xx, 429). */
    readonly retries: number
    /** Delay before the first retry; doubles on each further retry. */
    readonly retryDelayMs?: number
    /** Injectable for tests; defaults to the global fetch. */
    readonly fetch?: typeof fetch
}

const DEFAULT_RETRY_DELAY_MS = 300
const MAX_RETRY_DELAY_MS = 2000

const abortError = (): DOMException =>
    new DOMException('The operation was aborted', 'AbortError')

/**
 * fetch-based HttpClient for third-party JSON APIs. Requests never carry
 * credentials: with `credentials: 'include'` the browser demands a
 * non-wildcard CORS answer, which these APIs do not give.
 */
export class FetchHttpClient implements HttpClient {
    constructor(private readonly options: FetchHttpClientOptions) {}

    async getJson<T = unknown>(request: HttpRequest): Promise<T> {
        const maxRetries = request.retries ?? this.options.retries
        for (let attempt = 0; ; attempt++) {
            if (request.signal?.aborted) throw abortError()
            try {
                return await this.attempt<T>(request)
            } catch (error) {
                if (
                    attempt >= maxRetries ||
                    !isRetryable(error) ||
                    request.signal?.aborted
                ) {
                    throw error
                }
                await this.wait(this.retryDelay(attempt), request.signal)
            }
        }
    }

    private async attempt<T>(request: HttpRequest): Promise<T> {
        const controller = new AbortController()
        let timedOut = false
        const cancelTimeout = this.options.scheduler.setTimeout(() => {
            timedOut = true
            controller.abort()
        }, request.timeoutMs ?? this.options.timeoutMs)
        const forwardAbort = () => controller.abort()
        request.signal?.addEventListener('abort', forwardAbort, { once: true })

        try {
            const response = await this.send(request, controller.signal)
            if (!response.ok) throw new HttpError(response.status, request.url)
            return await this.parse<T>(response, request.url)
        } catch (error) {
            if (timedOut)
                throw new TimeoutError(`Request timed out: ${request.url}`)
            if (request.signal?.aborted) throw abortError()
            throw error
        } finally {
            cancelTimeout()
            request.signal?.removeEventListener('abort', forwardAbort)
        }
    }

    private async send(
        request: HttpRequest,
        signal: AbortSignal
    ): Promise<Response> {
        const doFetch = this.options.fetch ?? globalThis.fetch.bind(globalThis)
        try {
            return await doFetch(request.url, {
                method: 'GET',
                headers: request.headers,
                credentials: 'omit',
                signal,
            })
        } catch (error) {
            if (signal.aborted) throw error // timeout / caller abort: handled above
            throw new NetworkError('Network request failed', { cause: error })
        }
    }

    private async parse<T>(response: Response, url: string): Promise<T> {
        try {
            return (await response.json()) as T
        } catch (error) {
            throw new ProviderResponseError(
                `Invalid JSON in response from ${redactUrl(url)}`,
                {
                    cause: error,
                }
            )
        }
    }

    private retryDelay(attempt: number): number {
        const base = this.options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
        return Math.min(base * 2 ** attempt, MAX_RETRY_DELAY_MS)
    }

    private wait(ms: number, signal?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            const cancel = this.options.scheduler.setTimeout(() => {
                signal?.removeEventListener('abort', onAbort)
                resolve()
            }, ms)
            const onAbort = () => {
                cancel()
                reject(abortError())
            }
            signal?.addEventListener('abort', onAbort, { once: true })
        })
    }
}
