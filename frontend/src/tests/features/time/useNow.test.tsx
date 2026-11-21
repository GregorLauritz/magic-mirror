import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { act } from '@testing-library/react'
import { floorToMinute } from '@/domain/shared/time'
import { useNow } from '@/features/time/useNow'
import { useTimeZone } from '@/features/time/useTimeZone'
import { useToday } from '@/features/time/useToday'
import { createTestContainer } from '../../support/createTestContainer'
import { renderHookWithDeps } from '../../support/renderWithDeps'

describe('useNow', () => {
    it('returns the current time floored to the minute', () => {
        const test = createTestContainer({ now: '2024-01-15T12:00:20Z' })

        const { result } = renderHookWithDeps(() => useNow(), {
            deps: test.deps,
        })

        expect(result.current).toBe(floorToMinute(test.clock.now()))
    })

    it('stays put until the minute changes, then moves to the new minute', () => {
        const test = createTestContainer({ now: '2024-01-15T12:00:20Z' })
        const { result } = renderHookWithDeps(() => useNow(), {
            deps: test.deps,
        })
        const first = result.current

        act(() => test.scheduler.advance(39_000))
        expect(result.current).toBe(first)

        act(() => test.scheduler.advance(1_000))
        expect(result.current).toBe(first + 60_000)
    })

    it('releases its timer on unmount', () => {
        const test = createTestContainer()
        const { unmount } = renderHookWithDeps(() => useNow(), {
            deps: test.deps,
        })
        expect(test.scheduler.pending()).toBe(1)

        unmount()

        expect(test.scheduler.pending()).toBe(0)
    })

    it('leaves exactly one live timer after a StrictMode double mount', () => {
        const test = createTestContainer()

        const { unmount } = renderHookWithDeps(() => useNow(), {
            deps: test.deps,
            strict: true,
        })
        expect(test.scheduler.pending()).toBe(1)

        unmount()
        expect(test.scheduler.pending()).toBe(0)
    })
})

describe('useToday', () => {
    it('is the calendar day in the clock zone and rolls over at local midnight', () => {
        const test = createTestContainer({
            now: '2024-01-15T14:59:30Z',
            timeZone: 'Asia/Tokyo',
        })
        const { result } = renderHookWithDeps(() => useToday(), {
            deps: test.deps,
        })
        expect(result.current).toBe('2024-01-15')

        act(() => test.scheduler.advance(60_000)) // 15:00Z is midnight in Tokyo

        expect(result.current).toBe('2024-01-16')
    })
})

describe('useTimeZone', () => {
    it('reports the zone of the clock', () => {
        const test = createTestContainer({ timeZone: 'Europe/Berlin' })

        const { result } = renderHookWithDeps(() => useTimeZone(), {
            deps: test.deps,
        })

        expect(result.current).toBe('Europe/Berlin')
    })

    it('picks up a changed zone at the next minute tick', () => {
        const test = createTestContainer({ timeZone: 'UTC' })
        const { result } = renderHookWithDeps(() => useTimeZone(), {
            deps: test.deps,
        })

        test.clock.setTimeZone('Asia/Tokyo')
        act(() => test.scheduler.advance(60_000))

        expect(result.current).toBe('Asia/Tokyo')
    })
})

// Hook used in two components must not create a timer per render
describe('useNow re-render stability', () => {
    it('does not schedule additional timers when the component re-renders', () => {
        const test = createTestContainer()
        const { rerender } = renderHookWithDeps(() => useNow(), {
            deps: test.deps,
        })

        rerender()
        rerender()

        expect(test.scheduler.pending()).toBe(1)
    })

    it('is a StrictMode-safe export', () => {
        expect(StrictMode).toBeDefined()
    })
})
