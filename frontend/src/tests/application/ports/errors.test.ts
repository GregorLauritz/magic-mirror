import { describe, expect, it } from 'vitest'
import {
    HttpError,
    NetworkError,
    ProviderResponseError,
    TimeoutError,
    isRetryable,
} from '@/application/ports/errors'

describe('HttpError', () => {
    it('carries the status and a readable message', () => {
        const error = new HttpError(503, 'https://api.example.com/v1/forecast')

        expect(error.status).toBe(503)
        expect(error.message).toBe(
            'HTTP 503 for https://api.example.com/v1/forecast'
        )
        expect(error).toBeInstanceOf(Error)
    })

    it('never exposes the query string, which can contain API keys', () => {
        const error = new HttpError(
            401,
            'https://geocode.maps.co/search?country=DE&api_key=SECRET'
        )

        expect(error.url).toBe('https://geocode.maps.co/search')
        expect(error.message).not.toContain('SECRET')
        expect(error.message).not.toContain('api_key')
    })

    it('tolerates a url that cannot be parsed', () => {
        expect(new HttpError(500, 'not a url?token=x').url).toBe('not a url')
    })
})

describe('isRetryable', () => {
    it.each([
        ['a network error', new NetworkError('offline')],
        ['a timeout', new TimeoutError('slow')],
        ['HTTP 500', new HttpError(500, 'https://x.test/a')],
        ['HTTP 502', new HttpError(502, 'https://x.test/a')],
        ['HTTP 503', new HttpError(503, 'https://x.test/a')],
        ['HTTP 429 (rate limited)', new HttpError(429, 'https://x.test/a')],
    ])('retries %s', (_label, error) => {
        expect(isRetryable(error)).toBe(true)
    })

    it.each([
        ['HTTP 400', new HttpError(400, 'https://x.test/a')],
        ['HTTP 401', new HttpError(401, 'https://x.test/a')],
        ['HTTP 403', new HttpError(403, 'https://x.test/a')],
        ['HTTP 404', new HttpError(404, 'https://x.test/a')],
        ['a malformed provider response', new ProviderResponseError('bad')],
        ['an arbitrary error', new Error('boom')],
        ['an abort', new DOMException('aborted', 'AbortError')],
        ['a non-error value', 'nope'],
        ['undefined', undefined],
    ])('does not retry %s', (_label, error) => {
        expect(isRetryable(error)).toBe(false)
    })
})
