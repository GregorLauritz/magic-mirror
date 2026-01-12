import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLocation } from '../../hooks/useLocation'
import { LocationContext } from '../../common/LocationContext'
import { ReactNode } from 'react'

describe('useLocation', () => {
    it('should return location context value', () => {
        const mockContextValue = {
            longitude: 13.405,
            latitude: 52.52,
            isLoading: false,
        }

        const wrapper = ({ children }: { children: ReactNode }) => (
            <LocationContext.Provider value={mockContextValue}>
                {children}
            </LocationContext.Provider>
        )

        const { result } = renderHook(() => useLocation(), { wrapper })

        expect(result.current).toEqual(mockContextValue)
    })

    it('should return default values when no provider', () => {
        const { result } = renderHook(() => useLocation())

        expect(result.current).toEqual({
            longitude: 0,
            latitude: 0,
            isLoading: true,
        })
    })

    it('should update when context value changes', () => {
        const mockContextValue = {
            longitude: 13.405,
            latitude: 52.52,
            isLoading: true,
        }

        const wrapper = ({ children }: { children: ReactNode }) => (
            <LocationContext.Provider value={mockContextValue}>
                {children}
            </LocationContext.Provider>
        )

        const { result, rerender } = renderHook(() => useLocation(), {
            wrapper,
        })

        expect(result.current.isLoading).toBe(true)

        mockContextValue.isLoading = false
        rerender()

        expect(result.current.isLoading).toBe(false)
    })
})
