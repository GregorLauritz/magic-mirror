/// <reference types="vite/client" />

// Build-time configuration. Vite only exposes VITE_*-prefixed variables to
// client code; `loadConfig` (src/app/config.ts) validates and defaults them.
interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID?: string
    readonly VITE_REFRESH_INTERVAL_MS?: string
    readonly VITE_LOCALE?: string
    readonly VITE_WEATHER_ICON_ZOOM?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
