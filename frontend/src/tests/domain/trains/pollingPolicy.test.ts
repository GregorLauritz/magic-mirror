import { describe, expect, it } from 'vitest'
import { instant } from '@/domain/shared/time'
import {
    NEAR_WINDOW_MS,
    POLL_FAR_MS,
    POLL_NEAR_MS,
    nextPollDelayMs,
} from '@/domain/trains/pollingPolicy'
import { journey } from '../../support/trainFixtures'

const NOW = instant(Date.parse('2024-01-15T10:00:00Z'))
const inMinutes = (minutes: number) =>
    new Date(NOW + minutes * 60_000).toISOString()

describe('nextPollDelayMs', () => {
    it('polls rarely when there is nothing to watch', () => {
        expect(nextPollDelayMs([], NOW)).toBe(POLL_FAR_MS)
    })

    it('polls rarely while the next train is far away', () => {
        expect(nextPollDelayMs([journey(inMinutes(60))], NOW)).toBe(POLL_FAR_MS)
    })

    it('aims the next poll at the moment the near window starts', () => {
        // 7 min away, near window is the last 5: look again in 2 minutes
        expect(nextPollDelayMs([journey(inMinutes(7))], NOW)).toBe(120_000)
    })

    it('never polls faster than the near interval', () => {
        // 5.5 min away: the window starts in 30 s, but one poll per minute is the floor
        expect(nextPollDelayMs([journey(inMinutes(5.5))], NOW)).toBe(
            POLL_NEAR_MS
        )
    })

    it.each([5, 4, 1, 0])(
        'polls often when the train leaves in %i minute(s)',
        (minutes) => {
            expect(nextPollDelayMs([journey(inMinutes(minutes))], NOW)).toBe(
                POLL_NEAR_MS
            )
        }
    )

    it('polls often when every listed train has already left, to get a fresh list', () => {
        expect(
            nextPollDelayMs(
                [journey(inMinutes(-3)), journey(inMinutes(-1))],
                NOW
            )
        ).toBe(POLL_NEAR_MS)
    })

    it('looks at the earliest train still to come, in any list order', () => {
        const list = [
            journey(inMinutes(90)),
            journey(inMinutes(3)),
            journey(inMinutes(40)),
        ]

        expect(nextPollDelayMs(list, NOW)).toBe(POLL_NEAR_MS)
    })

    it('does not let a train that has left keep the poll rate high', () => {
        expect(
            nextPollDelayMs(
                [journey(inMinutes(-1)), journey(inMinutes(60))],
                NOW
            )
        ).toBe(POLL_FAR_MS)
    })

    it('B1: the delay is already part of the departure and is not added again', () => {
        // Leaves in 4 minutes (real-time) although it was planned 10 minutes
        // earlier. The legacy code added the delay again (read as minutes: ten
        // hours!) and polled rarely for a train about to leave.
        const delayed = journey(inMinutes(4), { delaySeconds: 600 })

        expect(nextPollDelayMs([delayed], NOW)).toBe(POLL_NEAR_MS)
    })

    it('uses documented constants', () => {
        expect(POLL_FAR_MS).toBe(5 * 60_000)
        expect(POLL_NEAR_MS).toBe(60_000)
        expect(NEAR_WINDOW_MS).toBe(5 * 60_000)
    })
})
