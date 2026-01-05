# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Magic Mirror is a personalized smart display dashboard application that shows real-time weather, calendar events, birthdays, and time. It integrates with Google Calendar via OAuth2 and displays information on a full-screen dashboard (originally designed for Raspberry Pi displays).

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Material-UI
- Backend: Node.js + Express + TypeScript + MongoDB
- Auth: OAuth2-Proxy (reverse proxy handling Google OAuth2)
- Infrastructure: Docker Compose, Ansible, Nginx

## Development Commands

### Frontend (run from `/frontend`)

```bash
yarn dev              # Dev server on port 3000 with hot reload
yarn build            # Production build (TypeScript + Vite)
yarn lint             # Run ESLint
yarn lint:fix         # Auto-fix ESLint issues
yarn format           # Run Prettier
```

### Backend (run from `/backend`)

```bash
yarn dev              # Dev server with nodemon + debugger (port 3001, debug on 9229)
yarn prod             # Production mode (ts-node)
yarn test             # Run all Mocha tests
yarn lint             # Run ESLint
yarn lint:fix         # Auto-fix ESLint issues
yarn format           # Run Prettier
```

**Running specific tests:**
```bash
# Single test file
mocha --require ts-node/register src/tests/calendar.test.ts --exit
```

### Docker Compose (run from `/docker-compose`)

```bash
docker compose -f docker-compose.dev.yml up      # Dev with hot reload
docker compose -f docker-compose.yml up          # Production
docker compose -f docker-compose.test.yml up     # Tests
docker compose -f docker-compose.sonar.yml up    # SonarQube
```

## Architecture Overview

### Request Flow

```
User (Browser)
    ↓ HTTPS:443
OAuth2-Proxy (authentication gateway)
    ├─ Routes /api/* → Backend (https://backend:3001/api/)
    ├─ Routes /*     → Frontend (http://frontend:3000/)
    └─ Injects auth headers: x-forwarded-user, x-forwarded-email, x-forwarded-access-token
        ↓
Backend (Express)
    ├─ Reads user identity from headers (no direct auth)
    ├─ Queries MongoDB
    └─ Calls external APIs (Google Calendar, Open-Meteo weather)
```

**Critical:** Backend does NOT handle authentication. OAuth2-Proxy handles all OAuth flow, session management, and token refresh. Backend trusts injected headers.

### Backend Structure

**Service-Repository Pattern:**

```
backend/src/
├── index.ts              # App entry, route registration, error handling
├── config/               # Environment config (ports, MongoDB, API URLs)
├── routes/               # Route handlers (thin controllers)
│   ├── weather/          # Weather endpoints
│   ├── events/           # Calendar events
│   ├── birthdays/        # Birthdays from calendar
│   ├── calendars/        # List Google calendars
│   ├── location/         # Geocoding
│   └── users/            # User settings CRUD
│       ├── index.ts      # Route definitions
│       ├── settings.ts   # Settings service + handlers
│       ├── users.ts      # User service + handlers
│       └── services.ts   # Repositories (DB access layer)
├── services/
│   ├── server/           # HTTP/HTTPS server (http2-express-bridge)
│   ├── database/         # MongoDB connection
│   ├── validators/       # Request validators (Range, Regex, Custom)
│   ├── google.ts         # Google Calendar API client
│   ├── headers.ts        # Extract auth headers
│   └── loggers.ts        # Winston logging
├── models/
│   ├── api/              # API response DTOs
│   └── mongo/            # Mongoose schemas (User, UserSettings)
└── tests/                # Mocha tests
```

**Pattern:** Route → Service (business logic) → Repository (database operations)

Example flow for user settings:
1. `routes/users/index.ts` - Defines `GET /api/users/settings/me`
2. `routes/users/settings.ts` - `UserSettingsService.getSettings()` handles logic
3. `routes/users/services.ts` - `UserSettingsRepository.get()` queries MongoDB

### Frontend Structure

**Component-based with Context + React Query:**

```
frontend/src/
├── main.tsx              # Entry point
├── App.tsx               # Router setup (/, /settings, /error)
├── routes/
│   ├── Dashboard.tsx     # Main dashboard (wraps components in contexts)
│   ├── Settings.tsx      # User settings form
│   └── ErrorPage.tsx     # Error display
├── components/           # UI components (each in own folder)
│   ├── current_weather/  # Current temperature display
│   ├── hourly_forecast/  # Hourly weather
│   ├── daily_forecast/   # Daily weather
│   ├── birthdays/        # Upcoming birthdays
│   ├── upcoming_events/  # Calendar events
│   ├── time/             # Clock display
│   ├── settings_form/    # Settings editor
│   └── appbar/           # Top navigation bar
├── apis/                 # React Query hooks for API calls
│   ├── current_weather.ts   # useGetCurrentWeather()
│   ├── user_settings.ts     # useGetUserSettings(), patchUserSettings()
│   └── ...
├── common/
│   ├── LocationContext.tsx  # Provides user location (from settings + geocoding)
│   ├── TimeContext.tsx      # Provides timezone + hourly/daily triggers
│   └── fetch.ts             # Custom fetch with retry logic
└── models/               # TypeScript interfaces
```

**State Management:**
- **Server state:** React Query (caching, refetching, loading/error states)
- **Global app state:** Context API (LocationContext, TimeContext)

Dashboard component wraps everything in providers:
```tsx
<LocationContextProvider>  {/* Fetches user location from settings, geocodes to coords */}
  <TimeContextProvider>     {/* Manages timezone, triggers hourly/daily updates */}
    {/* Weather/Events/Birthday components use both contexts */}
  </TimeContextProvider>
</LocationContextProvider>
```

## Authentication Architecture

**OAuth2-Proxy as Reverse Proxy:**

1. User accesses app → OAuth2-Proxy intercepts
2. If not authenticated → Redirects to Google OAuth2 login
3. After successful auth → OAuth2-Proxy sets secure cookies
4. All subsequent requests include cookies
5. OAuth2-Proxy validates session and injects headers into upstream requests:
   - `x-forwarded-user`: Google user ID (sub)
   - `x-forwarded-email`: User email
   - `x-forwarded-access-token`: Google OAuth access token

**Backend reads identity from headers:**
```typescript
import { getUserId } from 'services/headers';
const userId = getUserId(req); // Reads x-forwarded-user header
```

**Never implement auth logic in backend.** Trust OAuth2-Proxy headers. Use access token from headers to call Google APIs.

## API Structure

All backend routes prefixed with `/api/`:

| Route | Purpose |
|-------|---------|
| `GET /api/weather/current` | Current weather |
| `GET /api/weather/hourly` | Hourly forecast |
| `GET /api/weather/forecast` | Daily forecast |
| `GET /api/weather/icon/:code` | Weather icon image |
| `GET /api/events/` | Calendar events in time range |
| `GET /api/calendars` | List user's Google calendars |
| `GET /api/birthdays/` | Upcoming birthdays |
| `GET /api/location/geocode` | Convert city/country/zip → coordinates |
| `GET /api/users/settings/me` | Get current user settings |
| `PATCH /api/users/settings/me` | Update user settings |
| `POST /api/users/settings` | Create user settings |
| `DELETE /api/users/settings/me` | Delete user settings |
| `DELETE /api/users/me` | Delete user account |

**External APIs called by backend:**
- Open-Meteo API (weather data, no key needed)
- OpenWeatherMap (weather icons only)
- Geocode Maps (city → coordinates)
- Google Calendar API (events, birthdays)

## Database

**MongoDB Collections:**

1. **users** - Google OAuth user data
   - Fields: email, displayName, given_name, family_name, photo, sub, access_token, refresh_token
   - Indexes: email (unique), sub (unique)

2. **userSettings** - User preferences
   - Fields: sub, country, city, zip_code, events_cal_id, birthday_cal_id
   - Index: sub (unique)

**Connection:** Configured via env vars in `backend/src/config/index.ts`:
- `MONGO_HOSTNAME`, `MONGO_PORT`, `MONGO_USERNAME`, `MONGO_PASSWORD`
- Auth uses `authSource=admin`

## Configuration

**Environment files** (in `/docker-compose`):
- `.env` - Node version, OAuth2-Proxy version
- `backend.env` - MongoDB credentials, port, timezone
- `frontend.env` - API endpoint URL
- `proxy.env` - Google OAuth client ID/secret, domain

**Key backend config** (`backend/src/config/index.ts`):
- `SERVER_PORT` - Default 3001
- `ENABLE_HTTPS` - Toggle HTTP/HTTPS
- `FRONTEND_URL` - CORS origin
- `RATE_LIMIT` - 500 req/min per endpoint
- Weather API URLs (Open-Meteo, OpenWeatherMap, Geocode)

## Adding New Features

### Adding a new API endpoint:

1. **Create route handler** in `backend/src/routes/{feature}/`
   - Use validators from `services/validators/` for params
   - Call service layer for business logic

2. **Create service class** (if complex logic needed)
   - Implement business logic
   - Call repository or external APIs

3. **Create repository class** (if database access needed)
   - Handle Mongoose queries
   - Keep DB logic isolated from business logic

4. **Define models** in `backend/src/models/`
   - API DTOs in `models/api/`
   - Mongoose schemas in `models/mongo/`

5. **Register route** in `backend/src/index.ts`:
   ```typescript
   import { default as MyRoute } from 'routes/my_feature';
   server.app.use('/api/my_feature', MyRoute);
   ```

6. **Create React Query hook** in `frontend/src/apis/`
   - Use `customFetch` from `common/fetch.ts` for retry logic
   - Configure stale time, refetch intervals

7. **Use hook in component** - Follow patterns in `frontend/src/components/`

### Reading user identity in routes:

```typescript
import { getUserId } from 'services/headers';

const handler = (req: Request, res: Response) => {
  const userId = getUserId(req); // Gets x-forwarded-user
  // Use userId to query database or call services
};
```

### Using validators:

```typescript
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';
import { EParamType } from 'services/validators/parameter_validator';

const countValidator = new RangeParameterValidator(
  'count',
  { min: 1, max: 100 },
  EParamType.query,
  false // optional parameter
);

router.get('/', countValidator.validate(), handler);
```

## React Query Configuration

Global config in `App.tsx`:
```typescript
const queryCache = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: 300,
      staleTime: 60000, // 1 minute
    },
  },
});
```

## Testing

**Backend tests:** Mocha + Chai + Supertest
- Location: `backend/src/tests/`
- JSON schema validation tests in `backend/src/tests/json_schemas/`
- Run all: `yarn test`
- Run specific: `mocha --require ts-node/register src/tests/calendar.test.ts --exit`

**Frontend:** No tests currently present.

## Deployment

**Docker Compose services:**
1. `frontend` - Nginx serving Vite build (port 3000 internal)
2. `backend` - Express app (port 3001 internal)
3. `mongo` - MongoDB (port 27017 internal)
4. `oauth2-proxy` - Auth gateway (port 443 external)

**Networks:**
- `db` - Backend ↔ MongoDB
- `app` - OAuth2-Proxy ↔ Backend/Frontend

**Ansible deployment** (for Raspberry Pi):
- Playbook: `ansible/rpi_setup.yml`
- Targets "rpi" hosts in inventory

## Important Patterns & Conventions

1. **Service-Repository Pattern:** Always separate business logic (services) from data access (repositories)

2. **Authentication:** Never implement OAuth in backend. Trust OAuth2-Proxy headers.

3. **Error Handling:** Throw `ApiError` with status codes. Centralized handler in `index.ts` catches all errors.

4. **Logging:** Use `LOGGER` from `services/loggers.ts`. Winston configured with express-winston middleware.

5. **CORS:** Backend CORS restricted to `FRONTEND_URL` env var. Update for new domains.

6. **Context Usage:** LocationContext provides coords for weather. TimeContext triggers periodic refetches.

7. **Fetch Wrapper:** Frontend uses `customFetch` from `common/fetch.ts` for consistent retry logic and error handling.

8. **HTTP/2:** Backend uses `http2-express-bridge` for HTTP/2 support when HTTPS enabled.

9. **TypeScript:** Both frontend and backend use TypeScript. Frontend uses Vite, backend uses ts-node.

10. **Port Mapping:**
    - Frontend: 3000 (internal)
    - Backend: 3001 (internal)
    - MongoDB: 27017 (internal)
    - Debug: 9229 (backend dev)
    - HTTPS: 443 (OAuth2-Proxy external)
