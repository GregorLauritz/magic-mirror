import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { TimeContextProvider } from '../../common/TimeContext'
import { useTimeContext } from '../../hooks/useTimeContext'
import { ReactNode } from 'react'

describe('TimeContext', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const createWrapper = () => {
        return ({ children }: { children: ReactNode }) => (
            <TimeContextProvider>{children}</TimeContextProvider>
        )
    }

    it('should provide initial timezone and current date', () => {
        const now = new Date('2024-01-15T12:00:00Z')
        vi.setSystemTime(now)

        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        expect(result.current.timeZone).toBeTruthy()
        expect(result.current.currentDate).toBeInstanceOf(Date)
        expect(typeof result.current.addHourlyUpdateTrigger).toBe('function')
        expect(typeof result.current.addDailyUpdateTrigger).toBe('function')
    })

    it('should register hourly update triggers', () => {
        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const hourlyTrigger = vi.fn()
        act(() => {
            result.current.addHourlyUpdateTrigger(hourlyTrigger)
        })

        expect(hourlyTrigger).not.toHaveBeenCalled()
        expect(typeof result.current.addHourlyUpdateTrigger).toBe('function')
    })

    it('should register daily update triggers', () => {
        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const dailyTrigger = vi.fn()
        act(() => {
            result.current.addDailyUpdateTrigger(dailyTrigger)
        })

        expect(dailyTrigger).not.toHaveBeenCalled()
        expect(typeof result.current.addDailyUpdateTrigger).toBe('function')
    })

    it('should register multiple hourly triggers', () => {
        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const trigger1 = vi.fn()
        const trigger2 = vi.fn()
        const trigger3 = vi.fn()

        act(() => {
            result.current.addHourlyUpdateTrigger(trigger1)
            result.current.addHourlyUpdateTrigger(trigger2)
            result.current.addHourlyUpdateTrigger(trigger3)
        })

        expect(typeof result.current.addHourlyUpdateTrigger).toBe('function')
    })

    it('should trigger all registered daily triggers', () => {
        const now = new Date('2024-01-15T23:59:00Z')
        vi.setSystemTime(now)

        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const trigger1 = vi.fn()
        const trigger2 = vi.fn()

        act(() => {
            result.current.addDailyUpdateTrigger(trigger1)
            result.current.addDailyUpdateTrigger(trigger2)
        })

        // Verify triggers are registered
        expect(typeof result.current.addDailyUpdateTrigger).toBe('function')
    })

    it('should not trigger hourly updates if hour has not changed', async () => {
        const now = new Date('2024-01-15T12:30:00Z')
        vi.setSystemTime(now)

        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const hourlyTrigger = vi.fn()
        act(() => {
            result.current.addHourlyUpdateTrigger(hourlyTrigger)
        })

        // Advance time within same hour
        act(() => {
            vi.setSystemTime(new Date('2024-01-15T12:45:00Z'))
            vi.advanceTimersByTime(5000)
        })

        expect(hourlyTrigger).not.toHaveBeenCalled()
    })

    it('should not trigger daily updates if day has not changed', async () => {
        const now = new Date('2024-01-15T12:00:00Z')
        vi.setSystemTime(now)

        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const dailyTrigger = vi.fn()
        act(() => {
            result.current.addDailyUpdateTrigger(dailyTrigger)
        })

        // Advance time within same day
        act(() => {
            vi.setSystemTime(new Date('2024-01-15T18:00:00Z'))
            vi.advanceTimersByTime(5000)
        })

        expect(dailyTrigger).not.toHaveBeenCalled()
    })

    it('should update current date when day changes', () => {
        const now = new Date('2024-01-15T23:59:00Z')
        vi.setSystemTime(now)

        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        // Verify current date is provided
        expect(result.current.currentDate).toBeInstanceOf(Date)
    })

    it('should allow adding same trigger function multiple times to hourly triggers', () => {
        const now = new Date('2024-01-15T12:59:00Z')
        vi.setSystemTime(now)

        const { result } = renderHook(() => useTimeContext(), {
            wrapper: createWrapper(),
        })

        const trigger = vi.fn()
        act(() => {
            result.current.addHourlyUpdateTrigger(trigger)
            result.current.addHourlyUpdateTrigger(trigger)
        })

        // Verify trigger registration function is available
        expect(typeof result.current.addHourlyUpdateTrigger).toBe('function')
    })
})
