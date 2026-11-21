import { describe, expect, it, vi } from 'vitest'
import { singleFlight } from '@/application/support/singleFlight'

const deferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (error: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

describe('singleFlight', () => {
    it('shares one in-flight run between concurrent callers', async () => {
        const gate = deferred<string>()
        const fn = vi.fn(() => gate.promise)
        const run = singleFlight(fn)

        const first = run()
        const second = run()
        gate.resolve('done')

        expect(first).toBe(second)
        await expect(first).resolves.toBe('done')
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('uses the arguments of the call that started the run', async () => {
        const gate = deferred<void>()
        const fn = vi.fn((value: string) => gate.promise.then(() => value))
        const run = singleFlight(fn)

        void run('first')
        void run('second')
        gate.resolve()

        expect(fn).toHaveBeenCalledWith('first')
    })

    it('starts a fresh run once the previous one finished', async () => {
        const fn = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b')
        const run = singleFlight(fn)

        await expect(run()).resolves.toBe('a')
        await expect(run()).resolves.toBe('b')
    })

    it('shares a failure, then recovers for the next call', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce('ok')
        const run = singleFlight(fn)

        const first = run()
        const second = run()
        await expect(first).rejects.toThrow('boom')
        await expect(second).rejects.toThrow('boom')

        await expect(run()).resolves.toBe('ok')
    })
})
