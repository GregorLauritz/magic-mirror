import { afterEach, describe, expect, it, vi } from 'vitest'
import { SystemClock } from '@/infrastructure/browser/SystemClock'

describe('SystemClock', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('reports the current wall-clock time as an Instant', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-03-10T09:30:00Z'))

        expect(new SystemClock().now()).toBe(Date.parse('2024-03-10T09:30:00Z'))
    })

    it('reports the IANA time zone of the environment', () => {
        const zone = new SystemClock().timeZone()

        expect(zone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
        expect(zone.length).toBeGreaterThan(0)
    })
})
