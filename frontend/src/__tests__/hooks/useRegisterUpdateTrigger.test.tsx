import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRegisterUpdateTrigger } from '../../hooks/useRegisterUpdateTrigger'

describe('useRegisterUpdateTrigger', () => {
    it('should register trigger function on mount', () => {
        const mockRegisterFn = vi.fn()
        const mockRefetchFn = vi.fn()

        renderHook(() =>
            useRegisterUpdateTrigger(mockRegisterFn, mockRefetchFn)
        )

        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
        expect(mockRegisterFn).toHaveBeenCalledWith(expect.any(Function))
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
            ({ registerFn }) =>
                useRegisterUpdateTrigger(registerFn, mockRefetchFn),
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
            ({ refetchFn }) =>
                useRegisterUpdateTrigger(mockRegisterFn, refetchFn),
            {
                initialProps: { refetchFn: mockRefetchFn1 },
            }
        )

        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
        expect(mockRegisterFn).toHaveBeenCalledWith(expect.any(Function))

        rerender({ refetchFn: mockRefetchFn2 })

        // Should not re-register because isRegistered ref is already true
        expect(mockRegisterFn).toHaveBeenCalledTimes(1)
    })

    it('should call the latest refetchFn when trigger is invoked', () => {
        const mockRegisterFn = vi.fn()
        const mockRefetchFn1 = vi.fn()
        const mockRefetchFn2 = vi.fn()

        const { rerender } = renderHook(
            ({ refetchFn }) =>
                useRegisterUpdateTrigger(mockRegisterFn, refetchFn),
            {
                initialProps: { refetchFn: mockRefetchFn1 },
            }
        )

        // Get the registered trigger function
        const registeredTrigger = mockRegisterFn.mock.calls[0][0]

        // Call the trigger with the first refetch function
        registeredTrigger()
        expect(mockRefetchFn1).toHaveBeenCalledTimes(1)
        expect(mockRefetchFn2).toHaveBeenCalledTimes(0)

        // Change the refetch function reference
        rerender({ refetchFn: mockRefetchFn2 })

        // Call the trigger again - should call the NEW refetch function
        registeredTrigger()
        expect(mockRefetchFn1).toHaveBeenCalledTimes(1)
        expect(mockRefetchFn2).toHaveBeenCalledTimes(1)
    })
})
