import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    getTimezoneOffset,
    getLocaleDateString,
    getDayName,
    getDay,
    getMonth,
    getYear,
    getIsoDate,
    getDate,
    getTimeDifferenceInHours,
    getDifferenceInDays,
    isToday,
    isSameDate,
    getDateInXDays,
    getISODayStartString,
    getISODayEndString,
    getTimeFromDate,
} from '../../common/dateParser'

describe('dateParser', () => {
    describe('getTimezoneOffset', () => {
        it('should return numeric timezone offset by default', () => {
            const offset = getTimezoneOffset()
            expect(offset).toMatch(/^[+-]?\d+(\.\d+)?$/)
        })

        it('should return ISO format timezone when useIsoFormat is true', () => {
            const offset = getTimezoneOffset(true)
            expect(offset).toMatch(/^([+-]\d{2}:\d{2}|Z)$/)
        })
    })

    describe('getLocaleDateString', () => {
        it('should format date according to locale and options', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getLocaleDateString(date, 'en-US', {
                weekday: 'short',
            })
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })
    })

    describe('getDayName', () => {
        it('should return short weekday name by default', () => {
            const date = new Date('2024-01-15T12:00:00Z') // Monday
            const result = getDayName(date, 'en-US')
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })

        it('should return long weekday name when specified', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getDayName(date, 'en-US', 'long')
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })

        it('should return narrow weekday name when specified', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getDayName(date, 'en-US', 'narrow')
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })
    })

    describe('getDay', () => {
        it('should return zero-padded day of month', () => {
            expect(getDay(new Date('2024-01-05T12:00:00Z'))).toBe('05')
            expect(getDay(new Date('2024-01-15T12:00:00Z'))).toBe('15')
            expect(getDay(new Date('2024-01-01T12:00:00Z'))).toBe('01')
            expect(getDay(new Date('2024-01-31T12:00:00Z'))).toBe('31')
        })
    })

    describe('getMonth', () => {
        it('should return zero-padded month (1-based)', () => {
            expect(getMonth(new Date('2024-01-15T12:00:00Z'))).toBe('01')
            expect(getMonth(new Date('2024-05-15T12:00:00Z'))).toBe('05')
            expect(getMonth(new Date('2024-12-15T12:00:00Z'))).toBe('12')
        })
    })

    describe('getYear', () => {
        it('should return full year', () => {
            expect(getYear(new Date('2024-01-15T12:00:00Z'))).toBe('2024')
            expect(getYear(new Date('2023-06-30T12:00:00Z'))).toBe('2023')
            expect(getYear(new Date('2025-12-31T12:00:00Z'))).toBe('2025')
        })
    })

    describe('getIsoDate', () => {
        it('should return ISO date string (YYYY-MM-DD)', () => {
            expect(getIsoDate(new Date('2024-01-15T12:00:00Z'))).toBe(
                '2024-01-15'
            )
            expect(getIsoDate(new Date('2023-05-05T12:00:00Z'))).toBe(
                '2023-05-05'
            )
            expect(getIsoDate(new Date('2024-12-31T12:00:00Z'))).toBe(
                '2024-12-31'
            )
        })
    })

    describe('getDate', () => {
        it('should return date in DD.MM.YYYY format', () => {
            expect(getDate(new Date('2024-01-15T12:00:00Z'))).toBe('15.01.2024')
            expect(getDate(new Date('2023-05-05T12:00:00Z'))).toBe('05.05.2023')
            expect(getDate(new Date('2024-12-31T12:00:00Z'))).toBe('31.12.2024')
        })
    })

    describe('getTimeDifferenceInHours', () => {
        it('should calculate hours difference between dates', () => {
            const start = new Date('2024-01-15T12:00:00Z')
            const end = new Date('2024-01-15T15:00:00Z')
            const diff = getTimeDifferenceInHours(start, end)
            expect(diff).toBeCloseTo(3, 1)
        })

        it('should handle 24 hour differences', () => {
            const start = new Date('2024-01-15T12:00:00Z')
            const end = new Date('2024-01-16T12:00:00Z')
            const diff = getTimeDifferenceInHours(start, end)
            expect(diff).toBeCloseTo(24, 1)
        })

        it('should handle negative differences', () => {
            const start = new Date('2024-01-15T15:00:00Z')
            const end = new Date('2024-01-15T12:00:00Z')
            const diff = getTimeDifferenceInHours(start, end)
            expect(diff).toBeCloseTo(-3, 1)
        })
    })

    describe('getDifferenceInDays', () => {
        it('should calculate days difference between dates', () => {
            const start = new Date('2024-01-15T12:00:00Z')
            const end = new Date('2024-01-18T12:00:00Z')
            expect(getDifferenceInDays(start, end)).toBe(3)
        })

        it('should handle same day difference', () => {
            const start = new Date('2024-01-15T12:00:00Z')
            const end = new Date('2024-01-15T18:00:00Z')
            expect(getDifferenceInDays(start, end)).toBe(0)
        })

        it('should handle negative differences', () => {
            const start = new Date('2024-01-18T12:00:00Z')
            const end = new Date('2024-01-15T12:00:00Z')
            expect(getDifferenceInDays(start, end)).toBe(-3)
        })
    })

    describe('isToday', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should return true for today date', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            expect(isToday(new Date('2024-01-15T18:00:00Z'))).toBe(true)
        })

        it('should return false for yesterday', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            expect(isToday(new Date('2024-01-14T12:00:00Z'))).toBe(false)
        })

        it('should return false for tomorrow', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            expect(isToday(new Date('2024-01-16T12:00:00Z'))).toBe(false)
        })
    })

    describe('isSameDate', () => {
        it('should return true for same date with different times', () => {
            const date1 = new Date('2024-01-15T12:00:00Z')
            const date2 = new Date('2024-01-15T18:00:00Z')
            expect(isSameDate(date1, date2)).toBe(true)
        })

        it('should return false for different dates', () => {
            const date1 = new Date('2024-01-15T12:00:00Z')
            const date2 = new Date('2024-01-16T12:00:00Z')
            expect(isSameDate(date1, date2)).toBe(false)
        })

        it('should return false for same day different month', () => {
            const date1 = new Date('2024-01-15T12:00:00Z')
            const date2 = new Date('2024-02-15T12:00:00Z')
            expect(isSameDate(date1, date2)).toBe(false)
        })

        it('should return false for same day and month different year', () => {
            const date1 = new Date('2024-01-15T12:00:00Z')
            const date2 = new Date('2023-01-15T12:00:00Z')
            expect(isSameDate(date1, date2)).toBe(false)
        })
    })

    describe('getDateInXDays', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should return today when daysInFuture is 0', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            const result = getDateInXDays(0)
            expect(result.getDate()).toBe(15)
        })

        it('should return future date when daysInFuture is positive', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            const result = getDateInXDays(5)
            expect(result.getDate()).toBe(20)
        })

        it('should return past date when daysInFuture is negative', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            const result = getDateInXDays(-5)
            expect(result.getDate()).toBe(10)
        })

        it('should default to today when no parameter provided', () => {
            const now = new Date('2024-01-15T12:00:00Z')
            vi.setSystemTime(now)
            const result = getDateInXDays()
            expect(result.getDate()).toBe(15)
        })
    })

    describe('getISODayStartString', () => {
        it('should return ISO string for start of day with Z timezone by default', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getISODayStartString(date)
            expect(result).toBe('2024-01-15T00:00:00.000Z')
        })

        it('should use user timezone when useUserTimeZone is true', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getISODayStartString(date, true)
            expect(result).toMatch(/^2024-01-15T00:00:00\.000[+-]\d{2}:\d{2}$/)
        })
    })

    describe('getISODayEndString', () => {
        it('should return ISO string for end of day with Z timezone by default', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getISODayEndString(date)
            expect(result).toBe('2024-01-15T23:59:59.999Z')
        })

        it('should use user timezone when useUserTimeZone is true', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            const result = getISODayEndString(date, true)
            expect(result).toMatch(/^2024-01-15T23:59:59\.999[+-]\d{2}:\d{2}$/)
        })
    })

    describe('getTimeFromDate', () => {
        it('should return time in HH:MM format', () => {
            const date = new Date('2024-01-15T09:05:30Z')
            const result = getTimeFromDate(date)
            expect(result).toMatch(/^\d{2}:\d{2}$/)
        })

        it('should pad single digit hours and minutes', () => {
            const date = new Date()
            date.setHours(5, 3, 0, 0)
            const result = getTimeFromDate(date)
            expect(result).toMatch(/^05:03$/)
        })

        it('should handle double digit hours and minutes', () => {
            const date = new Date()
            date.setHours(15, 45, 0, 0)
            const result = getTimeFromDate(date)
            expect(result).toMatch(/^15:45$/)
        })
    })
})
