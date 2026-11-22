import { describe, expect, it } from 'vitest'
import { createQueryClient } from '@/app/queryClient'
import { HttpError, NetworkError } from '@/application/ports/errors'
import { createTestConfig } from '../support/createTestConfig'

type RetryFn = (failureCount: number, error: unknown) => boolean
type DelayFn = (attempt: number) => number

const defaults = () =>
    createQueryClient(
        createTestConfig({ staleTimeMs: 1234 })
    ).getDefaultOptions().queries!

describe('createQueryClient', () => {
    it('takes the freshness window from the config and refetches on focus', () => {
        expect(defaults().staleTime).toBe(1234)
        expect(defaults().refetchOnWindowFocus).toBe(true)
    })

    it('retries a transient failure once, on top of the HTTP client retries', () => {
        const retry = defaults().retry as RetryFn

        expect(retry(0, new NetworkError('offline'))).toBe(true)
        expect(retry(0, new HttpError(503, 'https://x.test/a'))).toBe(true)
        expect(retry(1, new NetworkError('offline'))).toBe(false)
    })

    it('never retries failures that cannot succeed on a second attempt', () => {
        const retry = defaults().retry as RetryFn

        expect(retry(0, new HttpError(404, 'https://x.test/a'))).toBe(false)
        expect(retry(0, new HttpError(401, 'https://x.test/a'))).toBe(false)
        expect(retry(0, new Error('invalid configuration'))).toBe(false)
    })

    it('backs off exponentially from 300ms, capped at 5s', () => {
        const delay = defaults().retryDelay as DelayFn

        expect([0, 1, 2].map(delay)).toEqual([300, 600, 1200])
        expect(delay(10)).toBe(5000)
    })

    it('creates an independent client on every call (no shared singleton)', () => {
        const config = createTestConfig()

        expect(createQueryClient(config)).not.toBe(createQueryClient(config))
    })
})
