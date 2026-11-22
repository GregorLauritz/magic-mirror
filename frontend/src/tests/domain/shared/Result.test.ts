import { describe, expect, it } from 'vitest'
import { err, ok } from '@/domain/shared/Result'

describe('Result', () => {
    it('wraps a success value', () => {
        expect(ok(42)).toEqual({ ok: true, value: 42 })
    })

    it('wraps a failure reason', () => {
        expect(err('not-found')).toEqual({ ok: false, error: 'not-found' })
    })

    it('keeps the two cases distinguishable for narrowing', () => {
        const result = ok(1) as
            | ReturnType<typeof ok<number>>
            | ReturnType<typeof err<string>>

        expect(result.ok ? result.value : result.error).toBe(1)
    })
})
