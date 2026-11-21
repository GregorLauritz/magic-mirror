import type { Cancel, Scheduler } from '@/application/ports/Scheduler'

export class BrowserScheduler implements Scheduler {
    setTimeout(fn: () => void, ms: number): Cancel {
        const id = globalThis.setTimeout(fn, ms)
        return () => globalThis.clearTimeout(id)
    }

    setInterval(fn: () => void, ms: number): Cancel {
        const id = globalThis.setInterval(fn, ms)
        return () => globalThis.clearInterval(id)
    }
}
