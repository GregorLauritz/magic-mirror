import type { QueryClient } from 'react-query'
import type { AppConfig } from '@/app/config'
import { createQueryClient } from '@/app/queryClient'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { AuthSessionService } from '@/application/auth/AuthSessionService'
import { createCalendarService } from '@/application/calendar/CalendarService'
import { createResolveCoordinates } from '@/application/location/resolveCoordinates'
import type { AppLifecycle } from '@/application/ports/AppLifecycle'
import type { AuthSession } from '@/application/ports/AuthSession'
import type { CalendarProvider } from '@/application/ports/CalendarProvider'
import type { Clock } from '@/application/ports/Clock'
import type { GeocodingProvider } from '@/application/ports/GeocodingProvider'
import type { HttpClient } from '@/application/ports/HttpClient'
import type { KeyValueStore } from '@/application/ports/KeyValueStore'
import type { OAuthTokenGateway } from '@/application/ports/OAuthTokenGateway'
import type { Scheduler } from '@/application/ports/Scheduler'
import type { WeatherProvider } from '@/application/ports/WeatherProvider'
import { ApiKeyStore } from '@/application/settings/ApiKeyStore'
import { createResetLocalData } from '@/application/settings/resetLocalData'
import { createSaveSettings } from '@/application/settings/saveSettings'
import { SettingsStore } from '@/application/settings/SettingsStore'
import { createWeatherService } from '@/application/weather/WeatherService'
import { BrowserAppLifecycle } from '@/infrastructure/browser/BrowserAppLifecycle'
import { BrowserScheduler } from '@/infrastructure/browser/BrowserScheduler'
import { SystemClock } from '@/infrastructure/browser/SystemClock'
import { MapsCoGeocodingProvider } from '@/infrastructure/geocode/MapsCoGeocodingProvider'
import { AuthorizedHttpClient } from '@/infrastructure/google/AuthorizedHttpClient'
import { GisTokenGateway } from '@/infrastructure/google/GisTokenGateway'
import { GoogleCalendarProvider } from '@/infrastructure/google/GoogleCalendarProvider'
import { FetchHttpClient } from '@/infrastructure/http/FetchHttpClient'
import { LocalStorageApiKeyRepository } from '@/infrastructure/storage/LocalStorageApiKeyRepository'
import { LocalStorageSettingsRepository } from '@/infrastructure/storage/LocalStorageSettingsRepository'
import { SessionTokenStore } from '@/infrastructure/storage/SessionTokenStore'
import { APP_STORAGE_PREFIX } from '@/infrastructure/storage/storageKeys'
import { WebStorageKeyValueStore } from '@/infrastructure/storage/WebStorageKeyValueStore'
import { OpenMeteoWeatherProvider } from '@/infrastructure/weather/OpenMeteoWeatherProvider'

// Read-only access to the user's calendars: all this app needs from Google.
const GOOGLE_CALENDAR_SCOPE =
    'https://www.googleapis.com/auth/calendar.readonly'

/** Ports a caller (typically a test) may replace before anything is built. */
export interface ContainerOverrides {
    readonly clock?: Clock
    readonly scheduler?: Scheduler
    readonly http?: HttpClient
    readonly weatherProvider?: WeatherProvider
    readonly geocodingProvider?: GeocodingProvider
    readonly calendarProvider?: CalendarProvider
    /** Where durable data lives; defaults to the browser's localStorage. */
    readonly localStore?: KeyValueStore
    /** Where per-session data (the Google token) lives; defaults to sessionStorage. */
    readonly sessionStore?: KeyValueStore
    readonly lifecycle?: AppLifecycle
    /** Replaces the Google Identity Services adapter; the real session logic still runs. */
    readonly oauthGateway?: OAuthTokenGateway
    /** Replaces the whole signed-in session (UI tests). */
    readonly authSession?: AuthSession
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

    const localStore =
        overrides.localStore ??
        new WebStorageKeyValueStore(() => window.localStorage)
    const sessionStore =
        overrides.sessionStore ??
        new WebStorageKeyValueStore(() => window.sessionStorage)

    // ── weather and location
    const weather = createWeatherService({
        provider:
            overrides.weatherProvider ??
            new OpenMeteoWeatherProvider(http, config.urls.openMeteo),
        clock,
    })
    const geocoding =
        overrides.geocodingProvider ??
        new MapsCoGeocodingProvider(http, config.urls.geocode)
    const resolveCoordinates = createResolveCoordinates({ geocoding })

    // ── settings
    const apiKeys = new ApiKeyStore(
        new LocalStorageApiKeyRepository(localStore)
    )
    const settings = new SettingsStore(
        new LocalStorageSettingsRepository(localStore)
    )
    const saveSettings = createSaveSettings({ settings, apiKeys, geocoding })

    // ── Google sign-in
    const oauthGateway =
        overrides.oauthGateway ??
        new GisTokenGateway({
            getGoogle: () => window.google,
            clientId: config.googleClientId,
            scope: GOOGLE_CALENDAR_SCOPE,
            scheduler,
            timeouts: {
                loadMs: config.auth.loadTimeoutMs,
                interactiveMs: config.auth.interactiveTimeoutMs,
                silentMs: config.auth.silentTimeoutMs,
            },
        })
    const auth =
        overrides.authSession ??
        new AuthSessionService({
            gateway: oauthGateway,
            tokens: new SessionTokenStore(sessionStore),
            clock,
            config: config.auth,
        })
    // Privacy: once signed out, nothing fetched with that account stays cached.
    auth.subscribe(() => {
        if (auth.getSnapshot().status === 'signed-out')
            queryClient.removeQueries(['google'])
    })

    // ── calendar: Google requests carry the signed-in user's token
    const calendar = createCalendarService({
        provider:
            overrides.calendarProvider ??
            new GoogleCalendarProvider(
                new AuthorizedHttpClient(http, auth),
                config.urls.googleCalendar
            ),
        clock,
    })

    const resetLocalData = createResetLocalData({
        stores: [localStore, sessionStore],
        prefix: APP_STORAGE_PREFIX,
        reload: [() => settings.reload(), () => apiKeys.reload()],
        clearCache: () => queryClient.clear(),
        lifecycle: overrides.lifecycle ?? new BrowserAppLifecycle(),
        signOut: () => auth.signOut(),
    })

    return {
        config,
        clock,
        scheduler,
        http,
        weather,
        calendar,
        apiKeys,
        settings,
        saveSettings,
        resetLocalData,
        auth,
        geocoding,
        resolveCoordinates,
        queryClient,
        // Background work that must not run while the graph is merely built.
        start: () => oauthGateway.warmUp(),
    }
}
