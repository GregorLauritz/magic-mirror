import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { externalFetchJson } from '../../common/externalFetch'

const json = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status })

// The legacy helper is now a thin shim over FetchHttpClient, so every legacy
// caller gets the retry/timeout behaviour that the helper only pretended to
// have (B6: `retries = 1` used to mean "zero retries").
describe('externalFetchJson (legacy shim)', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('returns the parsed body and forwards request headers', async () => {
        const fetchStub = vi.fn().mockResolvedValue(json({ ok: 1 }))
        vi.stubGlobal('fetch', fetchStub)

        const result = await externalFetchJson<{ ok: number }>(
            'https://api.example.com/x',
            { headers: { Authorization: 'Bearer t' } }
        )

        expect(result).toEqual({ ok: 1 })
        expect(fetchStub.mock.calls[0][1].headers).toEqual({
            Authorization: 'Bearer t',
        })
        expect(fetchStub.mock.calls[0][1].credentials).toBe('omit')
    })

    it('retries a network failure once (B6)', async () => {
        const fetchStub = vi
            .fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(json({ ok: 2 }))
        vi.stubGlobal('fetch', fetchStub)

        const promise = externalFetchJson<{ ok: number }>(
            'https://api.example.com/x'
        )
        await vi.advanceTimersByTimeAsync(300)

        await expect(promise).resolves.toEqual({ ok: 2 })
        expect(fetchStub).toHaveBeenCalledTimes(2)
    })

    it('reports a non-2xx status without retrying a client error', async () => {
        const fetchStub = vi.fn().mockResolvedValue(json({}, 404))
        vi.stubGlobal('fetch', fetchStub)

        await expect(
            externalFetchJson('https://api.example.com/x')
        ).rejects.toMatchObject({ status: 404 })
        expect(fetchStub).toHaveBeenCalledTimes(1)
    })
})
