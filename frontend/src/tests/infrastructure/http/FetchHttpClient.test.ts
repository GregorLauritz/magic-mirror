import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FetchHttpClient } from '@/infrastructure/http/FetchHttpClient'
import {
    HttpError,
    NetworkError,
    ProviderResponseError,
    TimeoutError,
} from '@/application/ports/errors'
import { FakeClock } from '../../support/FakeClock'
import { FakeScheduler } from '../../support/FakeScheduler'
import { settle } from '../../support/settle'

const json = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status })

const URL_UNDER_TEST = 'https://api.example.com/v1/data'

// A fetch that never answers on its own but honours the abort signal, like a
// real network request stuck on a dead connection.
const hangingFetch = () =>
    vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () =>
                    reject(
                        new DOMException(
                            'The operation was aborted',
                            'AbortError'
                        )
                    )
                )
            })
    )

describe('FetchHttpClient', () => {
    let clock: FakeClock
    let scheduler: FakeScheduler

    beforeEach(() => {
        clock = new FakeClock()
        scheduler = new FakeScheduler(clock)
    })

    const clientWith = (
        fetchImpl: typeof fetch,
        options: { retries?: number; timeoutMs?: number } = {}
    ) =>
        new FetchHttpClient({
            fetch: fetchImpl,
            scheduler,
            timeoutMs: options.timeoutMs ?? 10_000,
            retries: options.retries ?? 1,
            retryDelayMs: 300,
        })

    it('returns the parsed JSON body of a successful GET', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(json({ ok: true }))

        const result = await clientWith(fetchImpl).getJson<{ ok: boolean }>({
            url: URL_UNDER_TEST,
            headers: { Authorization: 'Bearer t' },
        })

        expect(result).toEqual({ ok: true })
        expect(fetchImpl).toHaveBeenCalledTimes(1)
        const [url, init] = fetchImpl.mock.calls[0]
        expect(url).toBe(URL_UNDER_TEST)
        expect(init.method).toBe('GET')
        expect(init.headers).toEqual({ Authorization: 'Bearer t' })
    })

    it('never sends credentials or cookies to third-party APIs', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(json({}))

        await clientWith(fetchImpl).getJson({ url: URL_UNDER_TEST })

        expect(fetchImpl.mock.calls[0][1].credentials).toBe('omit')
    })

    describe('retries (B6: the legacy helper never retried)', () => {
        it('retries once on a network error and then succeeds', async () => {
            const fetchImpl = vi
                .fn()
                .mockRejectedValueOnce(new TypeError('Failed to fetch'))
                .mockResolvedValueOnce(json({ ok: 1 }))

            const promise = clientWith(fetchImpl).getJson({
                url: URL_UNDER_TEST,
            })
            await settle()
            expect(scheduler.pending()).toBe(1) // the retry delay
            scheduler.advance(300)

            await expect(promise).resolves.toEqual({ ok: 1 })
            expect(fetchImpl).toHaveBeenCalledTimes(2)
        })

        it.each([500, 502, 503, 429])('retries HTTP %i', async (status) => {
            const fetchImpl = vi
                .fn()
                .mockResolvedValueOnce(json({}, status))
                .mockResolvedValueOnce(json({ ok: 1 }))

            const promise = clientWith(fetchImpl).getJson({
                url: URL_UNDER_TEST,
            })
            await settle()
            expect(scheduler.pending()).toBe(1) // the retry delay
            scheduler.advance(300)

            await expect(promise).resolves.toEqual({ ok: 1 })
            expect(fetchImpl).toHaveBeenCalledTimes(2)
        })

        it.each([400, 401, 403, 404])(
            'does not retry HTTP %i and reports the status',
            async (status) => {
                const fetchImpl = vi.fn().mockResolvedValue(json({}, status))

                const failure = clientWith(fetchImpl).getJson({
                    url: URL_UNDER_TEST,
                })

                await expect(failure).rejects.toMatchObject({
                    name: 'HttpError',
                    status,
                })
                expect(fetchImpl).toHaveBeenCalledTimes(1)
            }
        )

        it('stops after the configured number of additional attempts', async () => {
            const fetchImpl = vi
                .fn()
                .mockRejectedValue(new TypeError('offline'))

            const promise = clientWith(fetchImpl, { retries: 2 }).getJson({
                url: URL_UNDER_TEST,
            })
            const settled = promise.catch((error: unknown) => error)
            await settle()
            expect(scheduler.pending()).toBe(1) // the retry delay
            scheduler.advance(300) // first retry after 300ms
            await settle()
            expect(scheduler.pending()).toBe(1) // the retry delay
            scheduler.advance(600) // second retry after the doubled delay

            expect(await settled).toBeInstanceOf(NetworkError)
            expect(fetchImpl).toHaveBeenCalledTimes(3)
        })

        it('lets a single request opt out of retries', async () => {
            const fetchImpl = vi
                .fn()
                .mockRejectedValue(new TypeError('offline'))

            const failure = clientWith(fetchImpl).getJson({
                url: URL_UNDER_TEST,
                retries: 0,
            })

            await expect(failure).rejects.toBeInstanceOf(NetworkError)
            expect(fetchImpl).toHaveBeenCalledTimes(1)
        })
    })

    describe('timeouts and cancellation', () => {
        it('aborts a stuck request after timeoutMs and throws TimeoutError', async () => {
            const fetchImpl = hangingFetch()

            const failure = clientWith(fetchImpl, {
                timeoutMs: 5000,
                retries: 0,
            }).getJson({ url: URL_UNDER_TEST })
            const settled = failure.catch((error: unknown) => error)
            await vi.waitFor(() => expect(scheduler.pending()).toBe(1))
            scheduler.advance(5000)

            expect(await settled).toBeInstanceOf(TimeoutError)
            expect(fetchImpl.mock.calls[0][1]?.signal?.aborted).toBe(true)
        })

        it('lets a request override the default timeout', async () => {
            const fetchImpl = hangingFetch()

            const failure = clientWith(fetchImpl, {
                timeoutMs: 5000,
                retries: 0,
            }).getJson({ url: URL_UNDER_TEST, timeoutMs: 100 })
            const settled = failure.catch((error: unknown) => error)
            await vi.waitFor(() => expect(scheduler.pending()).toBe(1))
            scheduler.advance(100)

            expect(await settled).toBeInstanceOf(TimeoutError)
        })

        it('cancels the pending timeout once the response arrived', async () => {
            const fetchImpl = vi.fn().mockResolvedValue(json({}))

            await clientWith(fetchImpl).getJson({ url: URL_UNDER_TEST })

            expect(scheduler.pending()).toBe(0)
        })

        it('propagates an external abort as an AbortError and does not retry', async () => {
            const fetchImpl = hangingFetch()
            const controller = new AbortController()

            const failure = clientWith(fetchImpl).getJson({
                url: URL_UNDER_TEST,
                signal: controller.signal,
            })
            const settled = failure.catch((error: unknown) => error)
            await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1))
            controller.abort()

            const error = await settled
            expect(error).toMatchObject({ name: 'AbortError' })
            expect(fetchImpl).toHaveBeenCalledTimes(1)
        })

        it('does not call fetch at all when the signal is already aborted', async () => {
            const fetchImpl = vi.fn()
            const controller = new AbortController()
            controller.abort()

            const failure = clientWith(fetchImpl).getJson({
                url: URL_UNDER_TEST,
                signal: controller.signal,
            })

            await expect(failure).rejects.toMatchObject({ name: 'AbortError' })
            expect(fetchImpl).not.toHaveBeenCalled()
        })
    })

    describe('error reporting', () => {
        it('throws a ProviderResponseError for a body that is not JSON, without retrying', async () => {
            const fetchImpl = vi
                .fn()
                .mockResolvedValue(
                    new Response('<html>oops</html>', { status: 200 })
                )

            const failure = clientWith(fetchImpl).getJson({
                url: URL_UNDER_TEST,
            })

            await expect(failure).rejects.toBeInstanceOf(ProviderResponseError)
            expect(fetchImpl).toHaveBeenCalledTimes(1)
        })

        it('keeps API keys out of error messages', async () => {
            const fetchImpl = vi.fn().mockResolvedValue(json({}, 401))

            const failure = clientWith(fetchImpl).getJson({
                url: `${URL_UNDER_TEST}?api_key=SECRET`,
            })

            await expect(failure).rejects.toBeInstanceOf(HttpError)
            await expect(failure).rejects.not.toThrow(/SECRET/)
        })
    })
})
