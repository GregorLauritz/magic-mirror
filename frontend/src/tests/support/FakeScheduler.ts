import type { Cancel, Scheduler } from '@/application/ports/Scheduler'
import type { FakeClock } from './FakeClock'

interface Timer {
    readonly id: number
    at: number
    readonly everyMs?: number
    readonly fn: () => void
}

const MAX_RUNS_PER_ADVANCE = 10_000

/**
 * Scheduler driven by a FakeClock. `advance(ms)` moves the clock and runs every
 * due timer in order, so tests never wait for real time.
 */
export class FakeScheduler implements Scheduler {
    private timers: Timer[] = []
    private nextId = 1

    constructor(private readonly clock: FakeClock) {}

    setTimeout(fn: () => void, ms: number): Cancel {
        return this.add({ fn, at: this.clock.now() + Math.max(0, ms) })
    }

    setInterval(fn: () => void, ms: number): Cancel {
        const everyMs = Math.max(1, ms)
        return this.add({ fn, everyMs, at: this.clock.now() + everyMs })
    }

    /** Number of timers that have not fired or been cancelled (leak checks). */
    pending(): number {
        return this.timers.length
    }

    advance(ms: number): void {
        const target = this.clock.now() + ms
        let runs = 0
        for (;;) {
            const due = this.timers
                .filter((timer) => timer.at <= target)
                .sort((a, b) => a.at - b.at || a.id - b.id)[0]
            if (due === undefined) break
            if (++runs > MAX_RUNS_PER_ADVANCE) {
                throw new Error('FakeScheduler: too many timer runs (loop?)')
            }
            this.clock.set(due.at)
            if (due.everyMs === undefined) {
                this.timers = this.timers.filter((t) => t.id !== due.id)
            } else {
                due.at += due.everyMs
            }
            due.fn()
        }
        this.clock.set(target)
    }

    private add(timer: Omit<Timer, 'id'>): Cancel {
        const id = this.nextId++
        this.timers.push({ ...timer, id })
        return () => {
            this.timers = this.timers.filter((t) => t.id !== id)
        }
    }
}
