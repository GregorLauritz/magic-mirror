import { describe, expect, it } from 'vitest'
import { instant } from '@/domain/shared/time'

describe('instant', () => {
    it('wraps a finite epoch-milliseconds number', () => {
        expect(instant(1_700_000_000_000)).toBe(1_700_000_000_000)
        expect(instant(0)).toBe(0)
        expect(instant(-1)).toBe(-1)
    })

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
        'rejects the non-finite value %s',
        (value) => {
            expect(() => instant(value)).toThrow(RangeError)
        }
    )
})
