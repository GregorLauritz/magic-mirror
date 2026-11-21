import type { Clock } from '@/application/ports/Clock'
import { instant, type Instant, type TimeZoneId } from '@/domain/shared/time'

export class SystemClock implements Clock {
    now(): Instant {
        return instant(Date.now())
    }

    timeZone(): TimeZoneId {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    }
}
