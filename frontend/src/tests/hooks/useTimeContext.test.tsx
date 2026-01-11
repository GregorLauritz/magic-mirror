import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTimeContext } from '../../hooks/useTimeContext'
import { TimeContext } from '../../common/TimeContext'
import { ReactNode } from 'react'

describe('useTimeContext', () => {
    it('should return time context value', () => {
        const mockContextValue = {
            timeZone: 'Europe/Berlin',
            currentDate: new Date('2024-01-15T12:00:00Z'),
            addHourlyUpdateTrigger: vi.fn(),
            addDailyUpdateTrigger: vi.fn(),
        }

        const wrapper = ({ children }: { children: ReactNode }) => (
            <TimeContext.Provider value={mockContextValue}>
                {children}
            </TimeContext.Provider>
        )

        const { result } = renderHook(() => useTimeContext(), { wrapper })

        expect(result.current).toEqual(mockContextValue)
    })

    it('should return default values when no provider', () => {
        const { result } = renderHook(() => useTimeContext())

        expect(result.current.timeZone).toBe('GMT')
        expect(result.current.currentDate).toBeInstanceOf(Date)
        expect(typeof result.current.addHourlyUpdateTrigger).toBe('function')
        expect(typeof result.current.addDailyUpdateTrigger).toBe('function')
    })

    it('should access trigger registration functions', () => {
        const mockHourlyTrigger = vi.fn()
        const mockDailyTrigger = vi.fn()

        const mockContextValue = {
            timeZone: 'Europe/Berlin',
            currentDate: new Date('2024-01-15T12:00:00Z'),
            addHourlyUpdateTrigger: mockHourlyTrigger,
            addDailyUpdateTrigger: mockDailyTrigger,
        }

        const wrapper = ({ children }: { children: ReactNode }) => (
            <TimeContext.Provider value={mockContextValue}>
                {children}
            </TimeContext.Provider>
        )

        const { result } = renderHook(() => useTimeContext(), { wrapper })

        const testFn = vi.fn()
        result.current.addHourlyUpdateTrigger(testFn)
        result.current.addDailyUpdateTrigger(testFn)

        expect(mockHourlyTrigger).toHaveBeenCalledWith(testFn)
        expect(mockDailyTrigger).toHaveBeenCalledWith(testFn)
    })
})
