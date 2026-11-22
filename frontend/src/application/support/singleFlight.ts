/**
 * Coalesces concurrent calls: while a run is in flight every caller gets that
 * same promise (and the arguments of the call that started it). When it
 * settles, the next call starts a fresh run. Guards against a double submit.
 */
export const singleFlight = <A extends unknown[], R>(
    fn: (...args: A) => Promise<R>
): ((...args: A) => Promise<R>) => {
    let inFlight: Promise<R> | undefined
    return (...args) => {
        if (inFlight === undefined) {
            const run = fn(...args)
            const clear = () => {
                inFlight = undefined
            }
            run.then(clear, clear)
            inFlight = run
        }
        return inFlight
    }
}
