import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

describe('useRegisterUpdateTrigger', () => {
    it('should register trigger function on mount', () => {
        const mockRegisterFn = vi.fn()
        const mockRefetchFn = vi.fn()

        renderHook(() => useRegisterUpdateTrigger(mockRegisterFn, mockRefetchFn))

        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
        expect(mockRegisterFn).toHaveBeenCalledWith(mockRefetchFn)
    })

    it('should only register once even on re-render', () => {
        const mockRegisterFn = vi.fn()
        const mockRefetchFn = vi.fn()

        const { rerender } = renderHook(() =>
            useRegisterUpdateTrigger(mockRegisterFn, mockRefetchFn)
        )

        expect(mockRegisterFn).toHaveBeenCalledTimes(1)

        rerender()
        rerender()
        rerender()

        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
    })

    it('should not re-register if registerFn reference changes', () => {
        const mockRegisterFn1 = vi.fn()
        const mockRegisterFn2 = vi.fn()
        const mockRefetchFn = vi.fn()

        const { rerender } = renderHook(
            ({ registerFn }) => useRegisterUpdateTrigger(registerFn, mockRefetchFn),
            {
                initialProps: { registerFn: mockRegisterFn1 },
            }
        )

        expect(mockRegisterFn1).toHaveBeenCalledTimes(1)

        rerender({ registerFn: mockRegisterFn2 })

        // Should not call mockRegisterFn2 because isRegistered ref is already true
        expect(mockRegisterFn2).toHaveBeenCalledTimes(0)
        expect(mockRegisterFn1).toHaveBeenCalledTimes(1)
    })

    it('should not re-register if refetchFn reference changes', () => {
        const mockRegisterFn = vi.fn()
        const mockRefetchFn1 = vi.fn()
        const mockRefetchFn2 = vi.fn()

        const { rerender } = renderHook(
            ({ refetchFn }) => useRegisterUpdateTrigger(mockRegisterFn, refetchFn),
            {
                initialProps: { refetchFn: mockRefetchFn1 },
            }
        )

        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
        expect(mockRegisterFn).toHaveBeenCalledWith(mockRefetchFn1)

        rerender({ refetchFn: mockRefetchFn2 })

        // Should not re-register because isRegistered ref is already true
        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
    })
})
