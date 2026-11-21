import type { QueryClient } from 'react-query'
import type { AppConfig } from '@/app/config'
import type { Clock } from '@/application/ports/Clock'
import type { HttpClient } from '@/application/ports/HttpClient'
import type { Scheduler } from '@/application/ports/Scheduler'

/**
 * Everything the UI may depend on, assembled once by the composition root
 * (app/container.ts) and handed to React through <ServicesProvider>.
 *
 * Grows slice by slice as the layers are introduced; components never import
 * adapters, they read these through hooks.
 */
export interface AppDependencies {
    readonly config: AppConfig
    readonly clock: Clock
    readonly scheduler: Scheduler
    readonly http: HttpClient
    /** The only framework object in the container: server-state cache. */
    readonly queryClient: QueryClient
}
