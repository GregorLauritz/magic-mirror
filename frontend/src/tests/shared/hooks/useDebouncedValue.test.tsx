import { describe, expect, it } from 'vitest'
import { act } from '@testing-library/react'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { createTestContainer } from '../../support/createTestContainer'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const setup = (initial: string, delayMs = 300) => {
    const test = createTestContainer()
    const rendered = renderHookWithDeps(
        ({ value }) => useDebouncedValue(value, delayMs),
        { deps: test.deps },
        { initialProps: { value: initial } }
    )
    return { ...rendered, test }
}

describe('useDebouncedValue', () => {
    it('starts with the value it is given', () => {
        const { result } = setup('a')

        expect(result.current).toBe('a')
    })

    it('adopts a new value only after the delay', () => {
        const { result, rerender, test } = setup('a')

        rerender({ value: 'ab' })
        expect(result.current).toBe('a')
        act(() => test.scheduler.advance(299))
        expect(result.current).toBe('a')
        act(() => test.scheduler.advance(1))

        expect(result.current).toBe('ab')
    })

    it('starts the delay over with every change, so only the last value arrives', () => {
        const { result, rerender, test } = setup('a')

        rerender({ value: 'ab' })
        act(() => test.scheduler.advance(200))
        rerender({ value: 'abc' })
        act(() => test.scheduler.advance(200))
        expect(result.current).toBe('a')
        act(() => test.scheduler.advance(100))

        expect(result.current).toBe('abc')
    })

    it('leaves no timer behind once settled or unmounted', () => {
        const { rerender, unmount, test } = setup('a')
        rerender({ value: 'b' })
        expect(test.scheduler.pending()).toBe(1)
        act(() => test.scheduler.advance(300))
        expect(test.scheduler.pending()).toBe(0)

        rerender({ value: 'c' })
        unmount()

        expect(test.scheduler.pending()).toBe(0)
    })
})
