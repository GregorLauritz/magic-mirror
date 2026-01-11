# Test Mocking Guide for Backend

This document explains how the test mocking system works for the Magic Mirror backend.

## Overview

The backend tests now use **Vitest** with comprehensive mocking to prevent:
1. **MongoDB connection attempts** during tests
2. **Real external API calls** to weather services, geocoding, etc.
3. **Server actually starting** on a port

## Setup File Location

All mocking is configured in: [`src/tests/setup.ts`](src/tests/setup.ts)

This file is automatically loaded before all tests via the `setupFiles` configuration in [`vitest.config.ts`](vitest.config.ts).

## What's Mocked

### 1. MongoDB Connection
```typescript
vi.mock('../services/database/mongodb', () => {
  class MockMongoDb {
    // Mock implementation that doesn't actually connect
  }
  return { MongoDb: MockMongoDb };
});
```

**Result**: Tests run without requiring a MongoDB instance.

### 2. Mongoose Connection and Models
```typescript
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');

  const mockModel = vi.fn().mockImplementation(() => {
    return {
      findOne: vi.fn().mockResolvedValue(null),
      findOneAndUpdate: vi.fn().mockImplementation((filter, update) => {
        return Promise.resolve({
          ...filter,
          ...update.$set,
          _id: 'mock-id',
        });
      }),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    };
  });

  return {
    ...actual,
    connect: vi.fn().mockResolvedValue({ connection: { readyState: 1 } }),
    model: mockModel,
  };
});
```

**Result**: Mongoose connect calls are mocked and model operations (findOne, findOneAndUpdate, deleteOne) return mock data without database access.

### 3. Server Start Methods
```typescript
vi.mock('../services/server/http_server', async () => {
  const actual = await vi.importActual('../services/server/http_server');
  return {
    ...actual,
    HttpServer: class extends actual.HttpServer {
      start() {
        // Don't actually start the server
        vi.fn()();
      }
    },
  };
});
```

**Result**: Server initialization runs normally (creating Express app, registering routes), but `server.start()` doesn't bind to a port.

### 4. Google Calendar API (googleapis)
```typescript
vi.mock('googleapis', () => {
  const mockEventsList = vi.fn().mockResolvedValue({
    data: {
      items: [],
    },
  });

  const mockCalendarList = vi.fn().mockResolvedValue({
    data: {
      items: [],
    },
  });

  const mockCalendar = {
    events: {
      list: mockEventsList,
    },
    calendarList: {
      list: mockCalendarList,
    },
  };

  return {
    google: {
      calendar: function () {
        return mockCalendar;
      },
      auth: {
        OAuth2: class {
          setCredentials() {}
        },
      },
    },
  };
});
```

**Result**: Google Calendar API calls return empty event lists and calendar lists. Tests don't require valid Google OAuth credentials.

### 5. External API Calls (fetch)
```typescript
global.fetch = vi.fn();

beforeEach(() => {
  vi.mocked(global.fetch).mockImplementation((url) => {
    const urlString = url.toString();

    // Route to appropriate mock based on URL
    if (urlString.includes('open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ /* mock weather data */ }),
        arrayBuffer: async () => new ArrayBuffer(8),
        // ... other Response methods
      });
    }
    // ... more URL patterns
  });
});
```

**Result**: All external API calls are intercepted and return mock data.

## Mock Data

### Weather API (open-meteo.com)
Returns mock data including:
- `current_weather`: temperature, wind, weather code
- `hourly`: time series data
- `daily`: forecast for 5 days with temps, precipitation, sunrise/sunset

### Weather Icons (openweathermap.org)
Returns a mock `ArrayBuffer` for image data.

### Geocoding API
Returns mock coordinates:
```json
{
  "latitude": 48.7751458,
  "longitude": 9.165287
}
```

### Google Calendar API (googleapis.com)
Returns empty events list:
```json
{
  "data": {
    "items": []
  }
}
```

**Note**: Calendar and birthday endpoints use this mock. Add event data to `items` array to test with sample events.

## How to Customize Mocks

### For a Specific Test

You can override the global mock in individual tests:

```typescript
import { vi } from 'vitest';

it('should handle API error', async () => {
  // Override fetch for this test only
  vi.mocked(global.fetch).mockImplementationOnce(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      json: async () => ({ error: 'API Error' }),
    } as Response)
  );

  // Your test code
});
```

### Adding New API Mocks

Edit [`src/tests/setup.ts`](src/tests/setup.ts) and add a new URL pattern:

```typescript
beforeEach(() => {
  vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
    const urlString = url.toString();

    // Add your new mock here
    if (urlString.includes('your-new-api.com')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ /* your mock data */ }),
        arrayBuffer: async () => new ArrayBuffer(8),
        text: async () => '',
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        clone: () => ({ ok: true } as Response),
      } as Response);
    }

    // Existing mocks...
  });
});
```

## Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test src/tests/weather.test.ts

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch

# Open UI
yarn test:ui
```

## Benefits

✅ **Fast tests**: No network calls or database connections
✅ **Reliable**: Tests don't depend on external services
✅ **Isolated**: Each test runs independently
✅ **No setup required**: No need to run MongoDB or API services
✅ **CI/CD friendly**: Tests work in any environment

## Troubleshooting

### Tests Failing with "not a constructor" errors
- Ensure mocked classes use `class` syntax, not arrow functions
- Check that vi.mock() returns proper constructors

### Tests Making Real API Calls
- Check that the URL pattern in setup.ts matches the actual URL
- Verify setup.ts is in the `setupFiles` array in vitest.config.ts
- Ensure `beforeEach` is resetting the fetch mock

### MongoDB Connection Errors
- Verify the mongodb mock is before the mongoose mock in setup.ts
- Check that vi.mock paths are correct relative to setup.ts location

## Further Reading

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Vitest Setup Files](https://vitest.dev/config/#setupfiles)
- [Testing Fetch API](https://vitest.dev/guide/mocking.html#requests)
