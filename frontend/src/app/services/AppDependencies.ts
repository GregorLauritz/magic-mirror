import type { QueryClient } from 'react-query'
import type { AppConfig } from '@/app/config'
import type { Clock } from '@/application/ports/Clock'
import type { HttpClient } from '@/application/ports/HttpClient'
import type { Scheduler } from '@/application/ports/Scheduler'
import type { AuthSession } from '@/application/ports/AuthSession'
import type { GeocodingProvider } from '@/application/ports/GeocodingProvider'
import type { CalendarService } from '@/application/calendar/CalendarService'
import type { ResolveCoordinates } from '@/application/location/resolveCoordinates'
import type { ApiKeyStore } from '@/application/settings/ApiKeyStore'
import type { ResetLocalData } from '@/application/settings/resetLocalData'
import type { SaveSettings } from '@/application/settings/saveSettings'
import type { SettingsStore } from '@/application/settings/SettingsStore'
import type { WeatherService } from '@/application/weather/WeatherService'

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
    readonly weather: WeatherService
    readonly calendar: CalendarService
    readonly apiKeys: ApiKeyStore
    readonly settings: SettingsStore
    readonly saveSettings: SaveSettings
    readonly resetLocalData: ResetLocalData
    readonly auth: AuthSession
    readonly geocoding: GeocodingProvider
    readonly resolveCoordinates: ResolveCoordinates
    /** The only framework object in the container: server-state cache. */
    readonly queryClient: QueryClient
    /** Starts background work (warming up Google sign-in); call once at startup. */
    readonly start: () => void
}
