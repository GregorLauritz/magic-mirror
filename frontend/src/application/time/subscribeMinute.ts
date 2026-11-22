import type { Clock } from '@/application/ports/Clock'
import type { Cancel, Scheduler } from '@/application/ports/Scheduler'

/** The shape React's useSyncExternalStore expects from a subscribe function. */
export type Subscribe = (listener: () => void) => () => void

const MINUTE_MS = 60_000

/**
 * Notifies a listener at every wall-clock minute boundary (12:00:00, 12:01:00,
 * ...), so clock-like UI updates once a minute without polling.
 *
 * Each subscription owns its own timer chain, which keeps it independent of
 * other subscribers and safe under StrictMode's mount/unmount/mount. The delay
 * to the next boundary is recomputed from the clock every time, so a late
 * timer (busy thread, sleeping laptop) re-aligns instead of drifting.
 */
export const subscribeMinute =
    (clock: Clock, scheduler: Scheduler): Subscribe =>
    (listener) => {
        let active = true
        let cancel: Cancel | undefined

        const arm = () => {
            const untilNextMinute = MINUTE_MS - (clock.now() % MINUTE_MS)
            cancel = scheduler.setTimeout(() => {
                cancel = undefined
                listener()
                if (active) arm()
            }, untilNextMinute)
        }
        arm()

        return () => {
            active = false
            cancel?.()
            cancel = undefined
        }
    }
