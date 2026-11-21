import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribeMinute } from '@/application/time/subscribeMinute'
import { FakeClock } from '../../support/FakeClock'
import { FakeScheduler } from '../../support/FakeScheduler'

describe('subscribeMinute', () => {
    let clock: FakeClock
    let scheduler: FakeScheduler

    beforeEach(() => {
        // 20 seconds into a minute: the next boundary is 40s away
        clock = new FakeClock('2024-01-15T12:00:20Z')
        scheduler = new FakeScheduler(clock)
    })

    it('notifies at the next minute boundary, not before', () => {
        const listener = vi.fn()
        subscribeMinute(clock, scheduler)(listener)

        scheduler.advance(39_999)
        expect(listener).not.toHaveBeenCalled()

        scheduler.advance(1)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('keeps notifying on every following boundary', () => {
        const listener = vi.fn()
        subscribeMinute(clock, scheduler)(listener)

        scheduler.advance(40_000 + 2 * 60_000)

        expect(listener).toHaveBeenCalledTimes(3)
    })

    it('waits a full minute when it starts exactly on a boundary', () => {
        clock.set('2024-01-15T12:05:00Z')
        const listener = vi.fn()
        subscribeMinute(clock, scheduler)(listener)

        scheduler.advance(59_999)
        expect(listener).not.toHaveBeenCalled()
        scheduler.advance(1)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('re-aligns to the boundary after a late timer instead of drifting', () => {
        const listener = vi.fn()
        subscribeMinute(clock, scheduler)(listener)

        clock.advance(43_000) // the timer is 3s overdue, e.g. a busy main thread
        scheduler.advance(0)
        expect(listener).toHaveBeenCalledTimes(1)

        scheduler.advance(56_999) // 57s to the next boundary, not a flat 60s
        expect(listener).toHaveBeenCalledTimes(1)
        scheduler.advance(1)
        expect(listener).toHaveBeenCalledTimes(2)
    })

    it('stops and releases its timer on unsubscribe', () => {
        const listener = vi.fn()
        const unsubscribe = subscribeMinute(clock, scheduler)(listener)
        expect(scheduler.pending()).toBe(1)

        unsubscribe()
        scheduler.advance(5 * 60_000)

        expect(listener).not.toHaveBeenCalled()
        expect(scheduler.pending()).toBe(0)
    })

    it('tolerates unsubscribing twice', () => {
        const unsubscribe = subscribeMinute(clock, scheduler)(vi.fn())

        unsubscribe()

        expect(() => unsubscribe()).not.toThrow()
    })

    it('keeps subscribers independent of each other', () => {
        const subscribe = subscribeMinute(clock, scheduler)
        const first = vi.fn()
        const second = vi.fn()
        const stopFirst = subscribe(first)
        subscribe(second)

        stopFirst()
        scheduler.advance(40_000)

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('does not reschedule when a listener unsubscribes from inside its callback', () => {
        let stop: () => void = () => {}
        stop = subscribeMinute(clock, scheduler)(() => stop())

        scheduler.advance(40_000)

        expect(scheduler.pending()).toBe(0)
    })
})
