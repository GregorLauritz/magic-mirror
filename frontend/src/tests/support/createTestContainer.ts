import { createContainer, type ContainerOverrides } from '@/app/container'
import type { AppConfig } from '@/app/config'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { FakeAppLifecycle } from './FakeAppLifecycle'
import { FakeClock } from './FakeClock'
import { FakeHttpClient } from './FakeHttpClient'
import { FakeScheduler } from './FakeScheduler'
import { InMemoryKeyValueStore } from './InMemoryKeyValueStore'
import { createTestConfig, type TestConfigOverrides } from './createTestConfig'
import { createTestQueryClient } from './createTestQueryClient'

export interface TestContainer {
    readonly deps: AppDependencies
    readonly config: AppConfig
    readonly clock: FakeClock
    readonly scheduler: FakeScheduler
    readonly http: FakeHttpClient
    readonly lifecycle: FakeAppLifecycle
}

export interface TestContainerOptions extends ContainerOverrides {
    readonly config?: TestConfigOverrides
    /** Initial time of the fake clock. */
    readonly now?: string | number | Date
    readonly timeZone?: string
}

/**
 * The real application graph wired over fakes at the port boundary. Anything
 * can be replaced through the options; the dependants are built from the
 * replacement, not patched afterwards.
 */
export const createTestContainer = (
    options: TestContainerOptions = {}
): TestContainer => {
    const { config: configOverrides, now, timeZone, ...ports } = options
    const config = createTestConfig(configOverrides)
    const clock = new FakeClock(now, timeZone)
    const scheduler = new FakeScheduler(clock)
    const http = new FakeHttpClient()
    const lifecycle = new FakeAppLifecycle()

    const deps = createContainer(config, {
        clock,
        scheduler,
        http,
        queryClient: createTestQueryClient(),
        // isolated from the real browser storage unless a test injects its own
        localStore: new InMemoryKeyValueStore(),
        sessionStore: new InMemoryKeyValueStore(),
        lifecycle,
        ...ports,
    })

    return { deps, config, clock, scheduler, http, lifecycle }
}
