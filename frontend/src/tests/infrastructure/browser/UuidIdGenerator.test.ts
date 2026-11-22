import { describe, expect, it } from 'vitest'
import { UuidIdGenerator } from '@/infrastructure/browser/UuidIdGenerator'

describe('UuidIdGenerator', () => {
    it('makes version 4 UUIDs', () => {
        expect(new UuidIdGenerator().next()).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        )
    })

    it('never repeats', () => {
        const ids = new UuidIdGenerator()

        const made = new Set(Array.from({ length: 200 }, () => ids.next()))

        expect(made.size).toBe(200)
    })
})
