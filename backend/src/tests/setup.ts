import { afterAll, beforeAll, beforeEach, vi } from 'vitest';

// Mock MongoDB connection before any imports
vi.mock('../services/database/mongodb', () => {
  class MockMongoDb {
    _connection = null;
    _connectionString = 'mongodb://mock';
    _databaseType = 'mongodb';
    buildConnectionString = vi.fn();
    initDatabaseConnection = vi.fn();
    getConnection = vi.fn().mockReturnValue(null);
  }

  return {
    MongoDb: MockMongoDb,
  };
});

// Mock mongoose connect to prevent actual database connection
vi.mock('mongoose', async () => {
  const actual = await vi.importActual<typeof import('mongoose')>('mongoose');

  // Create a mock model function that returns a mock Mongoose model
  const mockModel = vi.fn().mockImplementation(() => {
    return {
      findOne: vi.fn().mockResolvedValue(null),
      findOneAndUpdate: vi.fn().mockImplementation((filter, update) => {
        // Return a mock document with the updated values
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
    connect: vi.fn().mockResolvedValue({
      connection: {
        readyState: 1,
      },
    }),
    model: mockModel,
  };
});

// Mock server start method to prevent it from actually starting
vi.mock('../services/server/http_server', async () => {
  const actual = await vi.importActual<typeof import('../services/server/http_server')>(
    '../services/server/http_server',
  );
  return {
    ...actual,
    HttpServer: class extends actual.HttpServer {
      start() {
        // Don't actually start the server in tests
        vi.fn()();
      }
    },
  };
});

vi.mock('../services/server/https_server', async () => {
  const actual = await vi.importActual<typeof import('../services/server/https_server')>(
    '../services/server/https_server',
  );
  return {
    ...actual,
    HttpsServer: class extends actual.HttpsServer {
      start() {
        // Don't actually start the server in tests
        vi.fn()();
      }
    },
  };
});

// Mock Google Calendar API (googleapis)
vi.mock('googleapis', () => {
  // Create persistent mock calendar that will be reused
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

// Mock fetch for external API calls
global.fetch = vi.fn();

beforeAll(() => {
  // Suppress server logs during tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  // Reset fetch mock before each test
  vi.mocked(global.fetch).mockReset();

  // Default mock implementation for fetch
  vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
    const urlString = url.toString();

    // Mock weather API responses
    if (urlString.includes('open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({
          latitude: 48.7751458,
          longitude: 9.165287,
          timezone: 'GMT',
          current_weather: {
            temperature: 15.5,
            windspeed: 10.2,
            winddirection: 180,
            weathercode: 0,
            time: '2024-01-15T12:00',
          },
          hourly: {
            time: [
              '2024-01-15T00:00',
              '2024-01-15T01:00',
              '2024-01-15T02:00',
              '2024-01-15T03:00',
              '2024-01-15T04:00',
              '2024-01-15T05:00',
              '2024-01-15T06:00',
              '2024-01-15T07:00',
              '2024-01-15T08:00',
              '2024-01-15T09:00',
              '2024-01-15T10:00',
              '2024-01-15T11:00',
              '2024-01-15T12:00',
              '2024-01-15T13:00',
              '2024-01-15T14:00',
              '2024-01-15T15:00',
              '2024-01-15T16:00',
              '2024-01-15T17:00',
              '2024-01-15T18:00',
              '2024-01-15T19:00',
              '2024-01-15T20:00',
              '2024-01-15T21:00',
              '2024-01-15T22:00',
              '2024-01-15T23:00',
            ],
            temperature_2m: [
              14, 14, 13, 13, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 19, 18, 17, 16, 15, 14, 14, 13, 13, 13,
            ],
            apparent_temperature: [
              13, 13, 12, 12, 11, 11, 12, 13, 14, 15, 16, 17, 18, 18, 18, 17, 16, 15, 14, 13, 13, 12, 12, 12,
            ],
            weathercode: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0],
          },
          daily: {
            time: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
            temperature_2m_max: [20, 22, 21, 19, 23],
            temperature_2m_min: [10, 12, 11, 9, 13],
            weathercode: [0, 1, 2, 3, 0],
            precipitation_sum: [0, 0.5, 1.2, 0, 0],
            precipitation_hours: [0, 1, 2, 0, 0],
            sunrise: [
              '2024-01-15T07:30:00',
              '2024-01-16T07:29:00',
              '2024-01-17T07:28:00',
              '2024-01-18T07:27:00',
              '2024-01-19T07:26:00',
            ],
            sunset: [
              '2024-01-15T17:00:00',
              '2024-01-16T17:01:00',
              '2024-01-17T17:02:00',
              '2024-01-18T17:03:00',
              '2024-01-19T17:04:00',
            ],
          },
          daily_units: {
            temperature_2m_max: '°C',
            temperature_2m_min: '°C',
            precipitation_sum: 'mm',
          },
        }),
        arrayBuffer: async () => new ArrayBuffer(8),
        text: async () => '',
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        clone: () => ({ ok: true }) as Response,
      } as Response);
    }

    // Mock weather icon API
    if (urlString.includes('openweathermap')) {
      const mockBuffer = new ArrayBuffer(8);
      // Check for valid icon codes (2 digits followed by 'd' or 'n')
      const iconMatch = urlString.match(/\/(\d{2}[dn])\.png/);
      const isValidIcon = iconMatch && iconMatch[1] && iconMatch[1] !== '00d' && iconMatch[1] !== '00n';

      if (!isValidIcon) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers(),
          arrayBuffer: async () => new ArrayBuffer(0),
          json: async () => ({ error: 'Icon not found' }),
          text: async () => '',
          blob: async () => new Blob(),
          formData: async () => new FormData(),
          clone: () => ({ ok: false }) as Response,
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        arrayBuffer: async () => mockBuffer,
        json: async () => ({}),
        text: async () => '',
        blob: async () => new Blob([mockBuffer]),
        formData: async () => new FormData(),
        clone: () => ({ ok: true }) as Response,
      } as Response);
    }

    // Mock geocoding API
    if (urlString.includes('geocode') || urlString.includes('maps.co')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({
          latitude: 48.7751458,
          longitude: 9.165287,
        }),
        arrayBuffer: async () => new ArrayBuffer(8),
        text: async () => '',
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        clone: () => ({ ok: true }) as Response,
      } as Response);
    }

    // Mock Google Calendar API
    try {
      const parsedUrl = new URL(urlString);
      const hostname = parsedUrl.hostname;

      if (hostname === 'googleapis.com' || hostname.endsWith('.googleapis.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({
            items: [],
          }),
          arrayBuffer: async () => new ArrayBuffer(8),
          text: async () => '',
          blob: async () => new Blob(),
          formData: async () => new FormData(),
          clone: () => ({ ok: true }) as Response,
        } as Response);
      }
    } catch {
      // If URL parsing fails, fall through to the default mock response below.
    }

    // Default mock response
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: async () => ({}),
      arrayBuffer: async () => new ArrayBuffer(8),
      text: async () => '',
      blob: async () => new Blob(),
      formData: async () => new FormData(),
      clone: () => ({ ok: true }) as Response,
    } as Response);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
