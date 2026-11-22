# Architecture

Magic Mirror is a static single-page app: no backend, no database. The browser
calls external APIs directly and keeps its data in `localStorage`. The code is
organised as a **hexagon**: the rules of the app sit in the middle and know
nothing about the browser, React or any API; everything that touches the
outside world is an adapter behind a port.

```
                 ┌────────────────────── app/ ──────────────────────┐
                 │  composition root: builds the graph, wires DI,   │
                 │  router, providers                               │
                 └──────────────────────────────────────────────────┘
      features/ , shared/              infrastructure/
      React UI + hooks                 adapters: fetch, storage, GIS, timers
              │                                 │
              ▼                                 ▼
        ┌───────────── application/ ─────────────┐
        │  ports (interfaces) + use cases         │
        └───────────────────┬─────────────────────┘
                            ▼
        ┌─────────────── domain/ ────────────────┐
        │  pure types and rules, no I/O at all    │
        └─────────────────────────────────────────┘
```

## The layers

| Folder            | What lives there                                                                                         | May import                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `domain/`         | Types and rules: `Instant`/`PlainDate`, calendar events, polling policy, settings validation, layout.    | `domain`                                                                                                 |
| `application/`    | **Ports** (`Clock`, `HttpClient`, `WeatherProvider`, ...) and use cases/services (`saveSettings`, ...).  | `domain`, `application`                                                                                  |
| `infrastructure/` | **Adapters** that implement ports: `FetchHttpClient`, `OpenMeteoWeatherProvider`, `GisTokenGateway`, ... | `domain`, `application`                                                                                  |
| `features/`       | React UI and feature hooks, one folder per feature, each with an `index.ts` barrel.                      | `domain`, `application`, `shared`, `app/services`, `app/routes`, other features **through their barrel** |
| `shared/`         | UI and hooks that belong to no feature (`CardFrame`, `ConfirmDialog`, `useStoreSnapshot`, ...).          | `domain`, `application`, `app/services`                                                                  |
| `app/`            | The composition root: `config`, `container`, `router`, `AppProviders`, `services/`.                      | everything                                                                                               |
| `tests/`          | Mirrors the layers; `support/` holds the fakes and render helpers.                                       | everything                                                                                               |

These rules are enforced: `yarn lint` fails (with no warnings allowed) when a
layer imports what it must not, when `domain`/`application` touch `window`,
`fetch`, timers, `new Date()` or `Date.now()`, when features reach into each
other's internals, or when imports form a cycle. `tests/repo/` keeps the folder
structure from drifting.

## Dependency injection

There is no DI library. `app/container.ts` has one function,
`createContainer(config, overrides)`, which constructs every adapter, hands it
to the services that need it and returns an `AppDependencies` object.
`ServicesProvider` puts that object in a React context and `useServices()`
reads it (it throws outside the provider). Components never construct
anything: they call feature hooks, and the hooks call `useServices()`.

`overrides` replace any port **before** its dependants are built, so a test can
swap one adapter and the real graph still runs on top of it:

```ts
const test = createTestContainer({ weatherProvider: new FakeWeatherProvider({ ... }) })
renderWithDeps(<CurrentWeatherWidget />, { deps: test.deps })
```

## Time

Nothing in `domain`/`application` reads the system clock or the browser's time
zone. "Now" comes from the `Clock` port (`now()`, `timeZone()`), timers from
the `Scheduler` port. Moments are `Instant`s (epoch ms) and calendar days are
`PlainDate`s (`"2024-03-31"`); every computation that depends on a zone takes
the zone as an argument (`startOfDay`, `toPlainDate`, ...). The test suite is
run in several time zones in CI.

## Persisted data

The keys are a compatibility contract with data saved by earlier versions and
must never be renamed: `magic-mirror.user-settings`, `magic-mirror.api-keys`
(localStorage) and `magic-mirror.google-token` (sessionStorage).
`infrastructure/storage/settingsDto.ts` maps the stored snake_case shape to the
domain model and back; it never throws, keeps keys it does not know and adds an
additive `schema_version`.

## Server state and external state

- Data fetched from APIs lives in react-query (v3). It is used in feature hooks
  and in a little plumbing (`app/queryClient.ts`, `app/AppProviders.tsx`,
  `shared/hooks/useInvalidateOnChange.ts`,
  `features/auth/useAuthenticatedQuery.ts`), so a later move to another cache
  touches only those.
- Settings, API keys and the sign-in state are observable stores in
  `application/`, read in React with `useSyncExternalStore` (`useStoreSnapshot`,
  `useSetting`) so a component re-renders only for what it uses.
- Queries that need a Google account go through `useAuthenticatedQuery`: it
  is enabled only for a signed-in user, stores data under the `['google', ...]`
  key and is purged when the user signs out.

## Recipe: add an external API

1. **Domain:** the types and rules you need (pure, with table tests).
2. **Port:** an interface in `application/ports/` (no token, no `fetch`).
3. **Adapter:** `infrastructure/<name>/<Name>Provider.ts` over the `HttpClient`
   port, with a separate pure mapper that turns the response into domain
   objects, drops entries it cannot understand and throws
   `ProviderResponseError` for a response that is not what it should be.
   Hand-author a fixture in `tests/fixtures/` from the API's documentation.
4. **Wire it:** add an override and the construction in `app/container.ts` and
   the field in `app/services/AppDependencies.ts`. Use the base URL from
   `app/config.ts`. For Google APIs wrap the client in `AuthorizedHttpClient`.
5. **Service** (only if there is policy to decide, e.g. which time range):
   `application/<name>/`. Otherwise hooks use the port directly.
6. **Feature:** hooks in `features/<name>/hooks/` over `useQuery` (or
   `useAuthenticatedQuery`), then the widget, then export it from `index.ts`.
7. **Tests first:** mapper, provider (URL and parameters), hooks, widget states
   (loading, error, empty, not configured). Add a fake for the port to
   `tests/support/` and an override to `createTestContainer`.

External calls never send credentials (cookies); the `HttpClient` adapter
guarantees it. A new key the user must supply belongs in `ApiKeys`, the
settings form and `api-keys.md`.

## Recipe: add a dashboard widget

Add the component to `features/<name>/`, export it from the barrel, and add one
entry to `features/dashboard/widgetRegistry.tsx` with its id and default
place. The id is stored in saved layouts: never rename one. Saved layouts from
before the widget existed are handled by `reconcileLayout`, which places new
widgets below the rest.

## Testing

- **Fakes at the port boundary**, not module mocks: `FakeClock`, `FakeScheduler`
  (moves the clock; `pending()` finds leaked timers), `FakeHttpClient`,
  `InMemoryKeyValueStore`, `FakeAuthSession`, `Fake*Provider`.
- `createTestContainer(options)` builds the real graph over those fakes;
  `renderWithDeps` / `renderHookWithDeps` render inside the same providers as
  the app (including StrictMode when asked).
- Write the regression test first and watch it fail. Bugs are pinned by a test
  named after what went wrong.
- `yarn test:coverage` enforces thresholds per layer (see `vite.config.ts`).
  They are ratcheted: raise them when coverage improves, never lower them.
