# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Magic Mirror is a personalized smart display dashboard application that shows real-time weather, calendar events, birthdays, train departures, and time. It's a **fully static, client-side-rendered app with no backend server or database** — the browser calls external APIs directly and signs in to Google using Google Identity Services (GIS). Originally designed for Raspberry Pi displays.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Material-UI + Yarn 4 as package manager
- Server state: react-query v3 (used in feature hooks and a little plumbing, see below)
- Auth: Google Identity Services (GIS) — in-browser OAuth2 token client, no server-side auth
- Hosting: a single Docker image (Nginx serving the static build over plain HTTP on 8080); TLS is the job of a reverse proxy in front of it

## Development Commands

Run from `/frontend`:

```bash
yarn dev              # Dev server on port 3000 with hot reload
yarn build            # Production build (TypeScript + Vite)
yarn lint             # ESLint incl. the architecture rules; no warnings allowed
yarn lint:fix         # Auto-fix ESLint issues
yarn format           # Run Prettier (yarn format:check to only check)
yarn test             # Run Vitest unit tests (watch mode; add --run for one pass)
yarn test:ui          # Vitest UI
yarn test:coverage    # Coverage report + per-layer thresholds
TZ=Asia/Tokyo yarn test --run   # time handling must not depend on the zone
```

### Production image (run from the repo root)

```bash
docker build -f frontend/docker/Dockerfile -t magic-mirror frontend
docker run --rm -p 8080:8080 magic-mirror    # http://localhost:8080
```

See [LOCAL_DEV.md](LOCAL_DEV.md) for details.

## Architecture Overview

The frontend follows a **hexagonal architecture**. The full description, the dependency rules and the recipes live in [`frontend/src/ARCHITECTURE.md`](frontend/src/ARCHITECTURE.md); this is the summary.

### Request Flow

```
Browser
  ├── Nginx container (static files, plain HTTP behind the user's TLS proxy) — the only server-side component
  ├── Google Identity Services  ──►  Google Calendar API (events, birthdays, calendar list)
  ├── Open-Meteo, OpenWeatherMap icons  (weather — keyless)
  ├── geocode.maps.co  (location lookup — user-supplied API key)
  ├── v6.db.transport.rest  (train departures — keyless, Deutsche Bahn public API)
  └── localStorage / sessionStorage  (settings, API keys, Google token)
```

**Critical:** There is no backend server, database, or auth proxy. Every external API call is made directly from the browser. Nginx's only job is serving the static build (with cache rules, security headers and a CSP).

### Frontend Structure

```
frontend/src/
├── main.tsx             # loadConfig → createContainer → <AppProviders><RouterProvider/>
├── domain/              # PURE types and rules (no React, no I/O, no clock)
│   ├── shared/          #   time (Instant, PlainDate, zone-explicit helpers), Result, Measurement
│   ├── location/ weather/ calendar/ trains/ settings/ auth/
├── application/         # framework-free: ports (interfaces) + use cases
│   ├── ports/           #   Clock, Scheduler, HttpClient, *Provider, *Repository, ...
│   └── auth|settings|location|weather|calendar|time/   services and use cases
├── infrastructure/      # adapters implementing the ports
│   ├── http/ browser/ storage/ google/ weather/ geocode/ trains/
├── features/            # React UI + feature hooks; each folder has an index.ts barrel
│   └── auth/ calendar/ dashboard/ errors/ settings/ settings-page/ shell/ time/ trains/ weather/
├── shared/              # UI/hooks used by several features (CardFrame, ConfirmDialog, ...)
├── app/                 # composition root
│   ├── config.ts        #   loadConfig(env): the only reader of VITE_* variables
│   ├── container.ts     #   createContainer(config, overrides): builds the whole graph
│   ├── router.tsx, routes.ts, AppProviders.tsx, queryClient.ts
│   └── services/        #   AppDependencies, ServicesProvider, useServices
└── tests/               # mirrors the layers; support/ has fakes + createTestContainer + renderWithDeps
```

**Dependency rules (enforced by ESLint, `yarn lint`):** `domain` imports only `domain`; `application` imports `domain` and `application`; `infrastructure` imports `domain` and `application`; `features`/`shared` use `domain`, `application`, `shared`, `@/app/services` (and `@/app/routes` for features) and reach other features only through their barrel (`@/features/<x>`); only `app/` may import everything. `domain`/`application` must not use `window`, `fetch`, timers, `new Date()` or `Date.now()` — time and I/O arrive through ports.

**Dependency injection:** hand-rolled composition root, no library. `createContainer(config, overrides)` builds adapters and services; `ServicesProvider` exposes them and components get them through feature hooks that call `useServices()`. Tests build the real graph over fakes with `createTestContainer`.

**State management:**
- **Server state:** react-query (caching, refetching, loading/error states) in feature hooks, plus `app/queryClient.ts`, `app/AppProviders.tsx`, `shared/hooks/useInvalidateOnChange.ts` and `features/auth/useAuthenticatedQuery.ts`
- **External state** (settings, API keys, sign-in state): observable stores in `application/`, read with `useSyncExternalStore` (`useSetting`, `useAuth`, ...)
- **Persisted state:** `localStorage` (settings, API keys) and `sessionStorage` (Google token), accessed only by `infrastructure/storage`

## Authentication Architecture

**Google Identity Services (GIS), entirely client-side:**

1. The app loads with no login gate — weather, trains, and the clock work immediately.
2. The user clicks "Sign in with Google" in Settings, which calls `useAuth().signIn`.
3. `infrastructure/google/GisTokenGateway` (the `OAuthTokenGateway` port) shows GIS's consent popup and returns a short-lived Calendar-scoped (`calendar.readonly`) access token.
4. `application/auth/AuthSessionService` keeps the token in `sessionStorage` (via `TokenStore`), renews it silently before it expires (single-flight, with a cooldown after a failure) and exposes `signed-out | signing-in | signed-in | needs-reauth`.
5. `infrastructure/google/AuthorizedHttpClient` adds `Authorization: Bearer <token>` to Google requests, so providers never handle tokens.
6. Calendar widgets and the calendar picker use `useAuthenticatedQuery`, which runs only for a signed-in user and stores data under the `['google', ...]` key; signing out purges that key.

**There is no server-side auth of any kind.** Never add a backend, session cookie, or reverse-auth-proxy for this — it's a deliberate architectural choice (see git history for the SSR→CSR migration).

## External APIs Called Directly From the Browser

| API | Used for | Key required? |
|-----|----------|----------------|
| `api.open-meteo.com` | Current/hourly/daily weather | No |
| `openweathermap.org` (icon CDN) | Weather icons | No |
| `geocode.maps.co` | City/country/zip → coordinates | Yes — user-supplied, see `api-keys.md` |
| `v6.db.transport.rest` | Train stations, journeys | No |
| `www.googleapis.com/calendar/v3` | Events, birthdays, calendar list | Google OAuth token (GIS) |

**All outbound calls go through the `HttpClient` port (`infrastructure/http/FetchHttpClient`)**, never bare `fetch()`, and never with credentials. Sending `credentials:'include'` (or cookies) to a third-party API causes the browser to require a non-wildcard CORS response, which these APIs don't return — the request would be silently blocked. The adapter also gives every call a timeout, retries only transient failures (network, 5xx, 429) and reports typed errors (`HttpError`, `NetworkError`, `TimeoutError`, `ProviderResponseError`).

## Settings & API Keys

`UserSettings` (address, calendar ids, dashboard layout, train connections) and the user-supplied API keys (Geocode Maps) live entirely in `localStorage`, behind `SettingsStore` / `ApiKeyStore` (`application/settings`) and the `LocalStorage*Repository` adapters. There is no cross-device sync — settings are per-browser.

The storage keys are a compatibility contract with data saved by earlier versions and must never be renamed or made configurable: `magic-mirror.user-settings`, `magic-mirror.api-keys` (localStorage) and `magic-mirror.google-token` (sessionStorage). `infrastructure/storage/settingsDto.ts` maps the stored snake_case shape to the domain model; it never throws, keeps keys it does not know and adds an additive `schema_version`. "Clear Local Data" (`resetLocalData`) removes every `magic-mirror.*` key from both storages, forgets cached server data and reloads the app.

`api-keys.md` (linked from Settings via `config.docsUrl`) explains how to obtain the Geocode Maps key — keep it in sync with `domain/settings/ApiKeys.ts` and the settings form.

## Adding a New External API Integration

1. **Domain:** the types and rules (pure, table-tested).
2. **Port:** an interface in `application/ports/` — no token parameter, no `fetch`.
3. **Adapter:** `infrastructure/<name>/` — a provider over the `HttpClient` port plus a pure mapper that turns the response into domain objects (drop what cannot be understood, throw `ProviderResponseError` for a malformed response). Base URL comes from `app/config.ts`; add its host to the CSP `connect-src` in `frontend/nginx/security-headers.conf`.
4. **Wire it** in `app/container.ts` (with an override for tests) and `app/services/AppDependencies.ts`. For Google APIs, wrap the client in `AuthorizedHttpClient`.
5. **Service** in `application/<name>/` only if there is policy to decide; otherwise hooks use the port directly.
6. **Feature:** hooks in `features/<name>/hooks/` using `useQuery` (or `useAuthenticatedQuery` for Google), then the widget; export it from the feature's `index.ts`.
7. If the API needs a user-supplied key, extend `ApiKeys`, the settings form and `api-keys.md`.
8. Add a fake for the port to `tests/support/` and write the tests first (mapper, provider, hooks, widget states).

## Adding a Dashboard Widget

Put the component in its feature, export it from the barrel and add one entry (id + default place) to `features/dashboard/widgetRegistry.tsx`. Widget ids are stored in saved layouts: never rename one.

## React Query Configuration

Global config in `app/queryClient.ts` (`createQueryClient(config)`): `refetchOnWindowFocus: true`, `staleTime` from `config.staleTimeMs`, and a retry policy that retries at most once and only for failures that can succeed on a second try (`isRetryable`). Live widgets pass `refetchInterval: config.refreshIntervalMs`; train polling follows `domain/trains/pollingPolicy`.

## Testing

**Frontend tests:** Vitest + Testing Library, in `frontend/src/tests/`, mirroring the layers (`domain/`, `application/`, `infrastructure/`, `features/`, `shared/`, `app/`, `repo/`).
- **Fakes at the port boundary**, not module mocks (`vi.spyOn(<module>)` on our own code is a smell): `FakeClock`, `FakeScheduler`, `FakeHttpClient`, `InMemoryKeyValueStore`, `FakeAuthSession`, `Fake*Provider`, ... in `tests/support/`.
- `createTestContainer(options)` builds the real graph over fakes; `renderWithDeps` / `renderHookWithDeps` render inside the app's providers.
- Write the regression test first and watch it fail. Hand-author API fixtures in `tests/fixtures/` from the API's documentation.
- Time must not depend on the machine: use `FakeClock`/`FakeScheduler`, local-time constructors only where a zone is irrelevant, and check `TZ=Asia/Tokyo` / `TZ=America/Los_Angeles` runs (CI does).
- Coverage thresholds are enforced per layer in `vite.config.ts` and are ratcheted: raise them when coverage improves, never lower them.
- Run all: `yarn test --run`; one file: `yarn test --run src/tests/domain/calendar/eventRules.test.ts`.

## Deployment

**One Docker image, nothing else** — no Kubernetes, Ansible or Compose files in this repo. `.github/workflows/deploy.yml` builds `frontend/docker/Dockerfile` and pushes `ghcr.io/<owner>/magic-mirror-frontend` (commit-SHA tags; `latest` only from `main`).

- Nginx (`frontend/nginx/nginx.conf`) listens on **8080, plain HTTP**, as a non-root user. TLS is terminated by whatever runs in front; Google Identity Services needs an `https://` origin (or `http://localhost`). `GET /health` is the health check.
- `index.html` is `no-cache`; only the hashed `/assets/` are `immutable`. The security headers and the Content-Security-Policy live in `frontend/nginx/security-headers.conf`, included in every location that sets headers. **A new external API host must be added to the CSP's `connect-src`** (and image hosts to `img-src`), or the browser blocks the call.
- Build-time configuration is passed as `--build-arg VITE_*` (`VITE_GOOGLE_CLIENT_ID`, `VITE_LOCALE`, `VITE_REFRESH_INTERVAL_MS`, `VITE_WEATHER_ICON_ZOOM`); empty means the default in `app/config.ts`.

## Important Patterns & Conventions

1. **No backend.** Don't add one. If a feature seems to need server-side secrets, prefer a user-supplied API key (like Geocode Maps) over a shared server-side credential.

2. **Respect the layers.** Business rules go in `domain`/`application`, I/O in `infrastructure`, React in `features`/`shared`, wiring only in `app`. Components don't construct adapters or touch `window`/`fetch`/`localStorage`; they call hooks that use `useServices()`. `yarn lint` enforces this.

3. **External fetches never send credentials** and go through the `HttpClient` port.

4. **Time through ports.** `Instant` and `PlainDate` instead of `Date` and zone-less strings; "now" from `Clock`, timers from `Scheduler`; every zone-dependent function takes the zone as an argument.

5. **Errors are values or typed.** Expected failures (validation, geocoding, auth) are returned as `Result`/discriminated unions; infrastructure throws the typed errors from `application/ports/errors`. No `alert()` — feedback is inline field messages and a Snackbar.

6. **Settings persistence:** only via `SettingsStore` / `ApiKeyStore` and their repositories — not a database, no cross-device sync. Never rename a storage key or a widget id.

7. **Google auth:** `AuthSessionService` + `useAuth` / `useAuthenticatedQuery`. Gate any Google Calendar-dependent query/UI on the sign-in state; never call `refetch()` to bypass `enabled`.

8. **TypeScript:** strict, with `noUnusedLocals`/`noUnusedParameters` — don't leave stale parameters when refactoring hook signatures. No `any` outside tests.

9. **Docs:** `api-keys.md` at repo root (served the same way as `privacy.md`/`impressum.md`) explains how to obtain the Geocode Maps API key — keep it in sync with the settings form. `frontend/src/ARCHITECTURE.md` describes the layers; update it when the rules change.
