export type Cancel = () => void

/** Timers as a port, so time-dependent logic can be driven deterministically. */
export interface Scheduler {
    setTimeout(fn: () => void, ms: number): Cancel
    setInterval(fn: () => void, ms: number): Cancel
}
