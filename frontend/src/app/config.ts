// Typed, validated application configuration.
//
// `loadConfig` is a pure function of an environment record so that tests (and
// the composition root) never reach for `import.meta.env` themselves; only
// main.tsx passes the real Vite env in. Vite exposes only variables prefixed
// with VITE_ to client code, so those are the only names read here.

export type WeatherIconZoom = '2x' | '4x'

export interface AppConfig {
    /** Google OAuth Client ID. Public by design (bundled client-side). */
    readonly googleClientId: string
    /** How often live widgets (weather, events, ...) refetch. */
    readonly refreshIntervalMs: number
    /** How long fetched data counts as fresh before a refetch is allowed. */
    readonly staleTimeMs: number
    /** BCP 47 locale used for date/time formatting. */
    readonly locale: string
    readonly weatherIconBaseUrl: string
    readonly weatherIconZoom: WeatherIconZoom
    /** Where the Settings screen links to for "how do I get these API keys". */
    readonly docsUrl: string
    readonly urls: {
        readonly openMeteo: string
        readonly geocode: string
        readonly trains: string
        readonly googleCalendar: string
    }
    readonly http: {
        readonly timeoutMs: number
        /** Additional attempts after the first one (network/5xx/429 only). */
        readonly retries: number
    }
    readonly auth: {
        /** Renew the Google token this long before it expires. */
        readonly refreshMarginMs: number
        /** After a failed renewal, pause silent attempts for this long. */
        readonly refreshCooldownMs: number
        /** How long the user gets to finish the consent popup. */
        readonly interactiveTimeoutMs: number
        /** How long a silent renewal may take. */
        readonly silentTimeoutMs: number
        /** How long to wait for the Google Identity Services script. */
        readonly loadTimeoutMs: number
    }
}

export type EnvSource = Readonly<Record<string, unknown>>

const DEFAULT_GOOGLE_CLIENT_ID =
    '428211582851-66891ucq97qkrbmsik41ftkfcke0u26f.apps.googleusercontent.com'
const DEFAULT_REFRESH_INTERVAL_MS = 120_000
const MIN_REFRESH_INTERVAL_MS = 10_000
const DEFAULT_LOCALE = 'en-US'
const DEFAULT_DOCS_URL =
    'https://github.com/GregorLauritz/magic-mirror/blob/main/api-keys.md'
const WEATHER_ICON_ZOOMS: readonly WeatherIconZoom[] = ['2x', '4x']

const readString = (env: EnvSource, key: string, fallback: string): string => {
    const value = env[key]
    if (typeof value !== 'string') return fallback
    const trimmed = value.trim()
    return trimmed === '' ? fallback : trimmed
}

const readRefreshInterval = (env: EnvSource): number => {
    const raw = env.VITE_REFRESH_INTERVAL_MS
    if (typeof raw !== 'string' || raw.trim() === '') {
        return DEFAULT_REFRESH_INTERVAL_MS
    }
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_REFRESH_INTERVAL_MS
    }
    return Math.max(parsed, MIN_REFRESH_INTERVAL_MS)
}

const readWeatherIconZoom = (env: EnvSource): WeatherIconZoom => {
    const raw = readString(env, 'VITE_WEATHER_ICON_ZOOM', '4x')
    return WEATHER_ICON_ZOOMS.find((zoom) => zoom === raw) ?? '4x'
}

export const loadConfig = (env: EnvSource): AppConfig => ({
    googleClientId: readString(
        env,
        'VITE_GOOGLE_CLIENT_ID',
        DEFAULT_GOOGLE_CLIENT_ID
    ),
    refreshIntervalMs: readRefreshInterval(env),
    staleTimeMs: 60_000,
    locale: readString(env, 'VITE_LOCALE', DEFAULT_LOCALE),
    weatherIconBaseUrl: 'https://openweathermap.org',
    weatherIconZoom: readWeatherIconZoom(env),
    docsUrl: DEFAULT_DOCS_URL,
    urls: {
        openMeteo: 'https://api.open-meteo.com/v1',
        geocode: 'https://geocode.maps.co',
        trains: 'https://v6.db.transport.rest',
        googleCalendar: 'https://www.googleapis.com/calendar/v3',
    },
    http: { timeoutMs: 10_000, retries: 1 },
    auth: {
        refreshMarginMs: 60_000,
        refreshCooldownMs: 300_000,
        interactiveTimeoutMs: 120_000,
        silentTimeoutMs: 15_000,
        loadTimeoutMs: 10_000,
    },
})
