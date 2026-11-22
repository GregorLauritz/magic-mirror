import type { Clock } from '@/application/ports/Clock'
import { instant, type Instant, type TimeZoneId } from '@/domain/shared/time'

/** Deterministic Clock for tests. Time only moves when the test says so. */
export class FakeClock implements Clock {
    private current: number

    constructor(
        start: number | string | Date = '2024-01-15T12:00:00Z',
        private zone: TimeZoneId = 'UTC'
    ) {
        this.current = new Date(start).getTime()
    }

    now(): Instant {
        return instant(this.current)
    }

    timeZone(): TimeZoneId {
        return this.zone
    }

    advance(ms: number): void {
        this.current += ms
    }

    set(to: number | string | Date): void {
        this.current = new Date(to).getTime()
    }

    setTimeZone(zone: TimeZoneId): void {
        this.zone = zone
    }
}
