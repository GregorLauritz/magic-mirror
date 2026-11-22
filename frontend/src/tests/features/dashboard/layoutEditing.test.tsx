import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { LayoutEditingProvider } from '@/features/dashboard/LayoutEditingProvider'
import { useLayoutEditing } from '@/features/dashboard/layoutEditingContext'

describe('layout editing', () => {
    it('starts off and toggles', () => {
        const { result } = renderHook(() => useLayoutEditing(), {
            wrapper: LayoutEditingProvider,
        })
        expect(result.current.isEditing).toBe(false)

        act(() => result.current.toggle())
        expect(result.current.isEditing).toBe(true)

        act(() => result.current.toggle())
        expect(result.current.isEditing).toBe(false)
    })

    it('keeps the same toggle function, so it is safe in effect dependencies', () => {
        const { result, rerender } = renderHook(() => useLayoutEditing(), {
            wrapper: LayoutEditingProvider,
        })
        const first = result.current.toggle

        act(() => result.current.toggle())
        rerender()

        expect(result.current.toggle).toBe(first)
    })

    it('refuses to be used outside its provider', () => {
        expect(() => renderHook(() => useLayoutEditing())).toThrow(
            /LayoutEditingProvider/
        )
    })
})
