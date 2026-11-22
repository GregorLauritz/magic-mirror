# Magic Mirror frontend

A React 19 + TypeScript + Vite single-page app that shows the weather, calendar
events, birthdays, train departures and the time on a mirror display. It is
fully static: the browser calls the external APIs directly and keeps its
settings in `localStorage`. There is no backend.

See [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md) for how the code is organised
(layers, dependency injection, recipes for adding an API or a widget) and the
repository's [`CLAUDE.md`](../CLAUDE.md) for the project conventions.

## Commands

Run from this directory with Yarn 4 (`corepack enable`):

```bash
yarn install
yarn dev              # dev server on http://localhost:3000
yarn build            # type-check + production build into dist/
yarn preview          # serve dist/ locally
yarn lint             # ESLint, including the architecture rules; no warnings allowed
yarn format           # Prettier (yarn format:check to only check)
yarn test             # Vitest in watch mode (yarn test --run for a single run)
yarn test:coverage    # with the coverage thresholds of every layer
```

Time handling is tested in several zones in CI; to try one locally:
`TZ=Asia/Tokyo yarn test --run`.

## Configuration

Build-time settings are read once, in `src/app/config.ts`, from `VITE_*`
variables (Vite exposes no others). All are optional:

| Variable                   | Default                  | Meaning                                         |
| -------------------------- | ------------------------ | ----------------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID`    | the project's client id  | OAuth client id for Google sign-in              |
| `VITE_REFRESH_INTERVAL_MS` | `120000` (minimum 10000) | how often live widgets refetch                  |
| `VITE_LOCALE`              | `en-US`                  | locale for dates, weekdays and country names    |
| `VITE_WEATHER_ICON_ZOOM`   | `4x`                     | weather icon size (`2x` or `4x`)                |

The user's own API keys (Geocode Maps) are entered in the app's Settings screen
and stored in the browser; see [`api-keys.md`](../api-keys.md).

## Layout of `src/`

```
app/             composition root: config, container (DI), router, providers
domain/          pure types and rules
application/     ports (interfaces) and use cases
infrastructure/  adapters: fetch, storage, Google Identity Services, timers
features/        React UI per feature (auth, calendar, dashboard, ...)
shared/          UI and hooks used by several features
tests/           mirrors the layers; support/ has the fakes and render helpers
```
