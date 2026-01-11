import { describe, it, expect } from 'vitest'
import { parseTime } from '../../common/timeParser'

describe('timeParser', () => {
    describe('parseTime', () => {
        it('should pad single digit numbers with leading zero', () => {
            expect(parseTime(0)).toBe('00')
            expect(parseTime(5)).toBe('05')
            expect(parseTime(9)).toBe('09')
        })

        it('should not pad double digit numbers', () => {
            expect(parseTime(10)).toBe('10')
            expect(parseTime(23)).toBe('23')
            expect(parseTime(59)).toBe('59')
        })

        it('should handle edge cases', () => {
            expect(parseTime(1)).toBe('01')
            expect(parseTime(99)).toBe('99')
        })
    })
})
