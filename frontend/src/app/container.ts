import type { QueryClient } from 'react-query'
import type { AppConfig } from '@/app/config'
import { createQueryClient } from '@/app/queryClient'
import type { AppDependencies } from '@/app/services/AppDependencies'
import type { Clock } from '@/application/ports/Clock'
import type { HttpClient } from '@/application/ports/HttpClient'
import type { Scheduler } from '@/application/ports/Scheduler'
import { BrowserScheduler } from '@/infrastructure/browser/BrowserScheduler'
import { SystemClock } from '@/infrastructure/browser/SystemClock'
import { FetchHttpClient } from '@/infrastructure/http/FetchHttpClient'

/** Ports a caller (typically a test) may replace before anything is built. */
export interface ContainerOverrides {
    readonly clock?: Clock
    readonly scheduler?: Scheduler
    readonly http?: HttpClient
    readonly queryClient?: QueryClient
}

/**
 * The composition root: the one place that knows which adapter implements
 * which port. Overrides are applied before the dependants are constructed, so
 * a replaced port is used everywhere, not patched in afterwards.
 */
export const createContainer = (
    config: AppConfig,
    overrides: ContainerOverrides = {}
): AppDependencies => {
    const clock = overrides.clock ?? new SystemClock()
    const scheduler = overrides.scheduler ?? new BrowserScheduler()
    const http =
        overrides.http ??
        new FetchHttpClient({
            scheduler,
            timeoutMs: config.http.timeoutMs,
            retries: config.http.retries,
        })
    const queryClient = overrides.queryClient ?? createQueryClient(config)

    return { config, clock, scheduler, http, queryClient }
}
