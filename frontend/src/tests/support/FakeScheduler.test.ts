import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeClock } from './FakeClock'
import { FakeScheduler } from './FakeScheduler'

describe('FakeScheduler', () => {
    let clock: FakeClock
    let scheduler: FakeScheduler

    beforeEach(() => {
        clock = new FakeClock('2024-01-15T12:00:00Z')
        scheduler = new FakeScheduler(clock)
    })

    it('runs a timeout once its delay has elapsed, and not before', () => {
        const fn = vi.fn()
        scheduler.setTimeout(fn, 1000)

        scheduler.advance(999)
        expect(fn).not.toHaveBeenCalled()

        scheduler.advance(1)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(scheduler.pending()).toBe(0)
    })

    it('runs due timers in order and moves the clock to each timer first', () => {
        const seen: Array<[string, number]> = []
        scheduler.setTimeout(() => seen.push(['b', clock.now()]), 200)
        scheduler.setTimeout(() => seen.push(['a', clock.now()]), 100)
        const start = clock.now()

        scheduler.advance(500)

        expect(seen).toEqual([
            ['a', start + 100],
            ['b', start + 200],
        ])
        expect(clock.now()).toBe(start + 500)
    })

    it('repeats an interval until it is cancelled', () => {
        const fn = vi.fn()
        const cancel = scheduler.setInterval(fn, 100)

        scheduler.advance(350)
        expect(fn).toHaveBeenCalledTimes(3)

        cancel()
        scheduler.advance(1000)
        expect(fn).toHaveBeenCalledTimes(3)
        expect(scheduler.pending()).toBe(0)
    })

    it('does not run a cancelled timeout', () => {
        const fn = vi.fn()
        const cancel = scheduler.setTimeout(fn, 100)
        cancel()

        scheduler.advance(1000)

        expect(fn).not.toHaveBeenCalled()
    })

    it('runs timers that a running timer schedules within the same advance', () => {
        const fn = vi.fn()
        scheduler.setTimeout(() => scheduler.setTimeout(fn, 50), 100)

        scheduler.advance(200)

        expect(fn).toHaveBeenCalledTimes(1)
    })
})
