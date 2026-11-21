import { runtimeConfig } from './runtimeConfig'

// The Google OAuth Client ID is not a secret (it's meant to be public/bundled
// client-side). It also needs "Authorized JavaScript origins" configured in
// Google Cloud Console for the origin(s) this app is served from, which Google
// Identity Services (GIS) requires for the browser-side token flow used here.
// Override it at build time with VITE_GOOGLE_CLIENT_ID.
export const GOOGLE_CLIENT_ID = runtimeConfig.googleClientId

export const GOOGLE_CALENDAR_SCOPE =
    'https://www.googleapis.com/auth/calendar.readonly'
