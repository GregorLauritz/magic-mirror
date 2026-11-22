# Magic Mirror

A personalized smart display dashboard showing real-time weather, calendar events, birthdays, and time — built for always-on displays (originally Raspberry Pi).

**Stack:** React · TypeScript · Vite · Nginx

Magic Mirror is a fully static, client-side app. There is no backend server or
database — the browser calls external APIs (Open-Meteo, geocode.maps.co,
db.transport.rest, Google Calendar) directly, and signs in to Google using
[Google Identity Services](https://developers.google.com/identity/gsi/web).
Settings and API keys are stored only in your browser (`localStorage`).

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Docker](https://docs.docker.com/engine/install/) | Building and running the image |
| An HTTPS reverse proxy (Caddy, Traefik, nginx, a tunnel, ...) | TLS in front of the container |
| Google Cloud project with an OAuth Client ID | Google Calendar sign-in |

A [Geocode Maps API key](https://geocode.maps.co/) is needed too, but it's
entered by each user in the app's Settings screen — see
[api-keys.md](api-keys.md) for details. It's not a deploy-time secret.

---

## First-Time Setup

### 1. Google OAuth Client ID

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Enable the **Google Calendar API** under *APIs & Services → Library*.
3. Go to *APIs & Services → Credentials* → **Create Credentials → OAuth 2.0 Client ID**.
4. Application type: **Web application**.
5. Add **Authorized JavaScript origins** for wherever the app is served, e.g.:
   ```
   https://mirror.example.com
   http://localhost:3000
   http://localhost:8080
   ```
   Google Identity Services uses this (not a redirect URI) to authorize the in-browser sign-in flow. Only `localhost` may use plain `http://`.
6. Save the **Client ID**. It's not a secret — it is baked into the build (see [Configuration](#configuration)). Without it, the build uses the project's default Client ID, which only works on the origins registered for it.

### 2. Run it

**Development** (hot reload):
```bash
cd frontend
yarn dev          # http://localhost:3000
```

**Production:** see [Deployment](#deployment) below, and [LOCAL_DEV.md](LOCAL_DEV.md) for running the image locally.

Open the app in your browser. There's no login gate — the dashboard loads immediately, showing weather/trains/clock. Click **Sign in with Google** in Settings to enable birthdays and calendar events.

---

## Post-Setup Configuration

Visit `/settings` to configure:

- **Location** — city, country, or zip code for weather
- **Geocode Maps API key** — required for location lookup, see [api-keys.md](api-keys.md)
- **Google Account** — sign in to enable birthdays and calendar events
- **Events / Birthday calendar** — Google Calendar ID for each
- **Train connections** — optional departure board widget

---

## Architecture

```
Browser
  ├── your HTTPS reverse proxy ──► Nginx container (static files)
  ├── Google Identity Services  ──► Google Calendar API (events, birthdays, calendar list)
  ├── Open-Meteo, OpenWeatherMap icons  (weather)
  ├── geocode.maps.co  (location lookup, user-supplied API key)
  ├── db.transport.rest  (train departures)
  └── localStorage  (settings, API keys, Google token)
```

There is no backend server, database, or auth proxy. Nginx serves the static
build over plain HTTP behind your TLS proxy; everything else is a direct
browser-to-API call.

---

## Development Commands

```bash
cd frontend
yarn dev          # Dev server on :3000 with hot reload
yarn build        # Production build (TypeScript + Vite)
yarn lint         # ESLint
yarn test         # Vitest unit tests
```

---

## Deployment

The only deliverable is a Docker image: nginx serving the static build over
**plain HTTP on port 8080**. CI publishes it to
`ghcr.io/gregorlauritz/magic-mirror-frontend` (tags `latest` and the commit
SHA) on every push to `main`.

```bash
docker run -d --name magic-mirror --restart unless-stopped \
  -p 8080:8080 ghcr.io/gregorlauritz/magic-mirror-frontend:latest
```

Put a TLS-terminating reverse proxy in front of it: Google sign-in only works
on `https://` origins (or `http://localhost`). The container answers
`GET /health` for health checks.

### Configuration

Settings are baked in at build time (Vite inlines `VITE_*` variables), so a
custom value means building your own image:

```bash
docker build -f frontend/docker/Dockerfile -t magic-mirror \
  --build-arg VITE_GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com \
  frontend
```

| Build arg | Default |
|-----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | the project's own Client ID |
| `VITE_LOCALE` | `en-US` |
| `VITE_REFRESH_INTERVAL_MS` | `120000` (minimum `10000`) |
| `VITE_WEATHER_ICON_ZOOM` | `4x` (or `2x`) |

### Kiosk displays

Point a full-screen browser at the app's URL. Google access tokens last about
an hour and are renewed with a Google popup; a browser that blocks popups
without a click will show "sign in again" until someone taps the button in
Settings. Allow popups for the app's origin on the kiosk browser.

### Upgrading from the server-based version

Earlier versions kept settings in MongoDB behind an Express backend. This
version stores them only in each browser's `localStorage`, so after upgrading
every display has to be set up again in `/settings` (location, Geocode Maps
key, calendars, train connections). The old backend, database and
oauth2-proxy are no longer used and can be removed.

---

[Impressum](impressum.md) | [Privacy Policy](privacy.md) | [API Keys](api-keys.md)
