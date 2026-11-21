import { describe, expect, it } from 'vitest'
import {
    formatDuration,
    journeySummary,
} from '@/features/trains/trainPresentation'
import { journey, leg } from '../../support/trainFixtures'

describe('formatDuration', () => {
    it.each([
        [0, '0m'],
        [5, '5m'],
        [59, '59m'],
        [60, '1h 0m'],
        [125, '2h 5m'],
        [1500, '25h 0m'],
    ])('%i minutes is %s', (minutes, expected) => {
        expect(formatDuration(minutes)).toBe(expected)
    })
})

describe('journeySummary', () => {
    const T = '2024-01-15T10:00:00Z'

    it('joins the lines and adds the duration', () => {
        const legs = [leg({ line: 'RE 5' }), leg({ line: 'ICE 71' })]

        expect(journeySummary(journey(T, { legs, durationMinutes: 150 }))).toBe(
            'RE 5 → ICE 71 • 2h 30m'
        )
    })

    it('leaves out walking legs', () => {
        const legs = [
            leg({ line: undefined, walking: true }),
            leg({ line: 'S1' }),
        ]

        expect(journeySummary(journey(T, { legs, durationMinutes: 20 }))).toBe(
            'S1 • 20m'
        )
    })

    it('shows just the duration when no line is known (no dangling separator)', () => {
        expect(
            journeySummary(
                journey(T, {
                    legs: [leg({ line: undefined })],
                    durationMinutes: 20,
                })
            )
        ).toBe('20m')
    })
})
