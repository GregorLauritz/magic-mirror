import { describe, expect, it } from 'vitest'
import { act } from '@testing-library/react'
import { useCarousel } from '@/features/trains/useCarousel'
import { createTestContainer } from '../../support/createTestContainer'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const setup = (count: number, intervalSeconds = 15, strict = false) => {
    const test = createTestContainer()
    const rendered = renderHookWithDeps(
        (props: { count: number; interval: number }) =>
            useCarousel(props.count, props.interval),
        { deps: test.deps, strict },
        { initialProps: { count, interval: intervalSeconds } }
    )
    return { ...rendered, test }
}

describe('useCarousel', () => {
    it('starts at the first item and moves on every interval, wrapping around', () => {
        const { result, test } = setup(3)
        expect(result.current.index).toBe(0)

        act(() => test.scheduler.advance(15_000))
        expect(result.current.index).toBe(1)
        act(() => test.scheduler.advance(15_000))
        expect(result.current.index).toBe(2)
        act(() => test.scheduler.advance(15_000))

        expect(result.current.index).toBe(0)
    })

    it('goes forward and back by hand, wrapping at both ends', () => {
        const { result } = setup(3)

        act(() => result.current.previous())
        expect(result.current.index).toBe(2)
        act(() => result.current.next())

        expect(result.current.index).toBe(0)
    })

    it('starts the countdown over after a manual move, so a choice is not overridden at once', () => {
        const { result, test } = setup(3)
        act(() => test.scheduler.advance(14_000))

        act(() => result.current.next())
        expect(result.current.index).toBe(1)
        act(() => test.scheduler.advance(1_000)) // would have advanced without the reset
        expect(result.current.index).toBe(1)
        act(() => test.scheduler.advance(14_000))

        expect(result.current.index).toBe(2)
    })

    it.each([0, 1])(
        'does nothing for %i item(s): no timer, index 0',
        (count) => {
            const { result, test } = setup(count)

            expect(test.scheduler.pending()).toBe(0)
            act(() => result.current.next())
            expect(result.current.index).toBe(0)
        }
    )

    it('keeps the index inside the list when the list shrinks (the legacy widget crashed here)', () => {
        const { result, rerender } = setup(3)
        act(() => result.current.previous()) // index 2

        rerender({ count: 2, interval: 15 })

        expect(result.current.index).toBe(1)
    })

    it('restarts its timer when the interval changes', () => {
        const { result, rerender, test } = setup(3, 15)

        rerender({ count: 3, interval: 5 })
        act(() => test.scheduler.advance(5_000))

        expect(result.current.index).toBe(1)
    })

    it('releases its timer on unmount, and keeps exactly one through StrictMode', () => {
        const { unmount, test } = setup(3, 15, true)
        expect(test.scheduler.pending()).toBe(1)

        unmount()

        expect(test.scheduler.pending()).toBe(0)
    })
})
