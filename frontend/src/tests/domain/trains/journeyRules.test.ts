import { describe, expect, it } from 'vitest'
import {
    delayMinutes,
    delaySeverity,
    isCancelled,
    transitLines,
} from '@/domain/trains/journeyRules'
import { journey, leg } from '../../support/trainFixtures'

const T = '2024-01-15T10:00:00Z'

describe('isCancelled', () => {
    it('is true when a train leg is cancelled', () => {
        expect(
            isCancelled(journey(T, { legs: [leg(), leg({ cancelled: true })] }))
        ).toBe(true)
    })

    it('ignores a walking leg flagged as cancelled', () => {
        expect(
            isCancelled(
                journey(T, {
                    legs: [leg({ walking: true, cancelled: true }), leg()],
                })
            )
        ).toBe(false)
    })

    it('is false for an on-time journey', () => {
        expect(isCancelled(journey(T))).toBe(false)
    })
})

describe('transitLines', () => {
    it('lists the lines of the train legs in order, without walking legs', () => {
        const legs = [
            leg({ line: undefined, walking: true }),
            leg({ line: 'RE 5' }),
            leg({ line: 'ICE 71' }),
        ]

        expect(transitLines(journey(T, { legs }))).toEqual(['RE 5', 'ICE 71'])
    })

    it('skips train legs without a line name', () => {
        expect(
            transitLines(journey(T, { legs: [leg({ line: undefined })] }))
        ).toEqual([])
    })
})

describe('delayMinutes (the delay is stored in seconds)', () => {
    it.each([
        [0, 0],
        [60, 1],
        [300, 5],
        [330, 6], // 5.5 min rounds up: never show a half minute
        [90, 2],
        [29, 0],
        [-120, 0], // early is not a delay
    ])('%i seconds is %i minute(s)', (seconds, minutes) => {
        expect(delayMinutes(journey(T, { delaySeconds: seconds }))).toBe(
            minutes
        )
    })
})

describe('delaySeverity', () => {
    it.each([
        [0, 'none'],
        [-60, 'none'],
        [60, 'minor'],
        [300, 'minor'], // up to five minutes
        [301, 'major'],
        [1800, 'major'],
    ] as const)('%i seconds is %s', (seconds, severity) => {
        expect(delaySeverity(journey(T, { delaySeconds: seconds }))).toBe(
            severity
        )
    })
})
