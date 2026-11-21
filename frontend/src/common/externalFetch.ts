// Transitional shim. The legacy services still call `externalFetchJson`; it now
// delegates to the HttpClient adapter, so they get its timeout, retry
// (network/5xx/429, never 4xx), typed errors and credential-free requests.
// Removed together with the last legacy caller (hexagonal refactor, step S8).
import { runtimeConfig } from '../constants/runtimeConfig'
import { BrowserScheduler } from '../infrastructure/browser/BrowserScheduler'
import { FetchHttpClient } from '../infrastructure/http/FetchHttpClient'

const http = new FetchHttpClient({
    scheduler: new BrowserScheduler(),
    timeoutMs: runtimeConfig.http.timeoutMs,
    retries: runtimeConfig.http.retries,
})

const toHeaderRecord = (
    headers: HeadersInit | undefined
): Record<string, string> | undefined => {
    if (headers === undefined) return undefined
    if (Array.isArray(headers)) return Object.fromEntries(headers)
    if (headers instanceof Headers) return Object.fromEntries(headers.entries())
    return headers
}

export const externalFetchJson = <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> =>
    http.getJson<T>({ url, headers: toHeaderRecord(options.headers) })
