import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserScheduler } from '@/infrastructure/browser/BrowserScheduler'

describe('BrowserScheduler', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('runs a timeout after its delay', () => {
        const fn = vi.fn()
        new BrowserScheduler().setTimeout(fn, 500)

        vi.advanceTimersByTime(499)
        expect(fn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('does not run a cancelled timeout', () => {
        const fn = vi.fn()
        const cancel = new BrowserScheduler().setTimeout(fn, 500)

        cancel()
        vi.advanceTimersByTime(1000)

        expect(fn).not.toHaveBeenCalled()
    })

    it('repeats an interval until it is cancelled', () => {
        const fn = vi.fn()
        const cancel = new BrowserScheduler().setInterval(fn, 100)

        vi.advanceTimersByTime(300)
        expect(fn).toHaveBeenCalledTimes(3)

        cancel()
        vi.advanceTimersByTime(300)
        expect(fn).toHaveBeenCalledTimes(3)
    })
})
