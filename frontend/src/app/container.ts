import type { QueryClient } from 'react-query'
import type { AppConfig } from '@/app/config'
import { createQueryClient } from '@/app/queryClient'
import type { AppDependencies } from '@/app/services/AppDependencies'
import type { Clock } from '@/application/ports/Clock'
import type { HttpClient } from '@/application/ports/HttpClient'
import type { Scheduler } from '@/application/ports/Scheduler'
import type { WeatherProvider } from '@/application/ports/WeatherProvider'
import type { AppLifecycle } from '@/application/ports/AppLifecycle'
import type { GeocodingProvider } from '@/application/ports/GeocodingProvider'
import type { KeyValueStore } from '@/application/ports/KeyValueStore'
import { createResolveCoordinates } from '@/application/location/resolveCoordinates'
import { ApiKeyStore } from '@/application/settings/ApiKeyStore'
import { createResetLocalData } from '@/application/settings/resetLocalData'
import { createSaveSettings } from '@/application/settings/saveSettings'
import { SettingsStore } from '@/application/settings/SettingsStore'
import { createWeatherService } from '@/application/weather/WeatherService'
import { BrowserScheduler } from '@/infrastructure/browser/BrowserScheduler'
import { SystemClock } from '@/infrastructure/browser/SystemClock'
import { FetchHttpClient } from '@/infrastructure/http/FetchHttpClient'
import { BrowserAppLifecycle } from '@/infrastructure/browser/BrowserAppLifecycle'
import { MapsCoGeocodingProvider } from '@/infrastructure/geocode/MapsCoGeocodingProvider'
import { LocalStorageApiKeyRepository } from '@/infrastructure/storage/LocalStorageApiKeyRepository'
import { LocalStorageSettingsRepository } from '@/infrastructure/storage/LocalStorageSettingsRepository'
import { APP_STORAGE_PREFIX } from '@/infrastructure/storage/storageKeys'
import { WebStorageKeyValueStore } from '@/infrastructure/storage/WebStorageKeyValueStore'
import { OpenMeteoWeatherProvider } from '@/infrastructure/weather/OpenMeteoWeatherProvider'

/** Ports a caller (typically a test) may replace before anything is built. */
export interface ContainerOverrides {
    readonly clock?: Clock
    readonly scheduler?: Scheduler
    readonly http?: HttpClient
    readonly weatherProvider?: WeatherProvider
    readonly geocodingProvider?: GeocodingProvider
    /** Where durable data lives; defaults to the browser's localStorage. */
    readonly localStore?: KeyValueStore
    /** Where per-session data (the Google token) lives; defaults to sessionStorage. */
    readonly sessionStore?: KeyValueStore
    readonly lifecycle?: AppLifecycle
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

    const weather = createWeatherService({
        provider:
            overrides.weatherProvider ??
            new OpenMeteoWeatherProvider(http, config.urls.openMeteo),
        clock,
    })

    const localStore =
        overrides.localStore ??
        new WebStorageKeyValueStore(() => window.localStorage)
    const apiKeys = new ApiKeyStore(
        new LocalStorageApiKeyRepository(localStore)
    )

    const geocoding =
        overrides.geocodingProvider ??
        new MapsCoGeocodingProvider(http, config.urls.geocode)
    const resolveCoordinates = createResolveCoordinates({ geocoding })

    const settings = new SettingsStore(
        new LocalStorageSettingsRepository(localStore)
    )
    const saveSettings = createSaveSettings({ settings, apiKeys, geocoding })

    const sessionStore =
        overrides.sessionStore ??
        new WebStorageKeyValueStore(() => window.sessionStorage)
    const resetLocalData = createResetLocalData({
        stores: [localStore, sessionStore],
        prefix: APP_STORAGE_PREFIX,
        reload: [() => settings.reload(), () => apiKeys.reload()],
        clearCache: () => queryClient.clear(),
        lifecycle: overrides.lifecycle ?? new BrowserAppLifecycle(),
    })

    return {
        config,
        clock,
        scheduler,
        http,
        weather,
        apiKeys,
        settings,
        saveSettings,
        resetLocalData,
        geocoding,
        resolveCoordinates,
        queryClient,
    }
}
