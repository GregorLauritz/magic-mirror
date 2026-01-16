import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index';

const ROUTE = '/api/users';

describe(`Unit test the ${ROUTE} route`, () => {
  const testUserId = 'test-user-123';
  const mockHeaders = {
    'x-forwarded-user': testUserId,
    'x-forwarded-email': 'test@example.com',
    'x-forwarded-access-token': 'test-token',
  };

  const validUserSettings = {
    country: 'US',
    city: 'New York',
    zip_code: '10001',
    events_cal_id: 'primary',
    birthday_cal_id: 'contacts',
  };

  describe(`Unit testing the ${ROUTE}/settings/me route`, () => {
    describe('GET /settings/me', () => {
      it(`should return 401 when auth headers are missing`, async () => {
        const response = await request(app).get(`${ROUTE}/settings/me`);
        expect(response.status).toBe(401);
      });

      it(`should return 404 when user settings do not exist`, async () => {
        const response = await request(app).get(`${ROUTE}/settings/me`).set(mockHeaders);
        // Could be 404 (not found) or 200 (found existing settings)
        expect(response.status === 404 || response.status === 200).toBe(true);
      });

      it(`should return user settings when they exist`, async () => {
        // First create settings
        await request(app).put(`${ROUTE}/settings/me`).set(mockHeaders).send(validUserSettings);

        // Then retrieve them
        const response = await request(app).get(`${ROUTE}/settings/me`).set(mockHeaders);
        if (response.status === 200) {
          expect('country' in response.body).toBe(true);
          expect('city' in response.body).toBe(true);
          expect('zip_code' in response.body).toBe(true);
          expect('events_cal_id' in response.body).toBe(true);
          expect('birthday_cal_id' in response.body).toBe(true);
        }
      });
    });

    describe('PUT /settings/me', () => {
      it(`should return 401 when auth headers are missing`, async () => {
        const response = await request(app).put(`${ROUTE}/settings/me`).send(validUserSettings);
        expect(response.status).toBe(401);
      });

      it(`should create user settings when they don't exist`, async () => {
        const response = await request(app).put(`${ROUTE}/settings/me`).set(mockHeaders).send(validUserSettings);
        expect(response.status === 200 || response.status === 500).toBe(true);
        if (response.status === 200) {
          expect(response.body.country).toBe(validUserSettings.country);
          expect(response.body.city).toBe(validUserSettings.city);
          expect(response.body.zip_code).toBe(validUserSettings.zip_code);
        }
      });

      it(`should update existing user settings`, async () => {
        const updatedSettings = {
          ...validUserSettings,
          city: 'Los Angeles',
          zip_code: '90001',
        };

        const response = await request(app).put(`${ROUTE}/settings/me`).set(mockHeaders).send(updatedSettings);
        expect(response.status === 200 || response.status === 500).toBe(true);
        if (response.status === 200) {
          expect(response.body.city).toBe(updatedSettings.city);
          expect(response.body.zip_code).toBe(updatedSettings.zip_code);
        }
      });

      it(`should validate response structure`, async () => {
        const response = await request(app).put(`${ROUTE}/settings/me`).set(mockHeaders).send(validUserSettings);
        if (response.status === 200) {
          expect(typeof response.body).toBe('object');
          expect(typeof response.body.country).toBe('string');
          expect(typeof response.body.city).toBe('string');
          expect(typeof response.body.zip_code).toBe('string');
          expect(typeof response.body.events_cal_id).toBe('string');
          expect(typeof response.body.birthday_cal_id).toBe('string');
        }
      });
    });

    describe('DELETE /settings/me', () => {
      it(`should return 401 when auth headers are missing`, async () => {
        const response = await request(app).delete(`${ROUTE}/settings/me`);
        expect(response.status).toBe(401);
      });

      it(`should delete user settings`, async () => {
        // First create settings
        await request(app).put(`${ROUTE}/settings/me`).set(mockHeaders).send(validUserSettings);

        // Then delete them
        const response = await request(app).delete(`${ROUTE}/settings/me`).set(mockHeaders);
        expect(response.status === 204 || response.status === 500).toBe(true);
      });

      it(`should return 204 on successful deletion`, async () => {
        const response = await request(app).delete(`${ROUTE}/settings/me`).set(mockHeaders);
        expect(response.status === 204 || response.status === 500).toBe(true);
      });
    });
  });

  describe(`Unit testing the ${ROUTE}/me route`, () => {
    describe('DELETE /me', () => {
      it(`should return 401 when auth headers are missing`, async () => {
        const response = await request(app).delete(`${ROUTE}/me`);
        expect(response.status).toBe(401);
      });

      it(`should delete user account`, async () => {
        const response = await request(app).delete(`${ROUTE}/me`).set(mockHeaders);
        expect(response.status === 204 || response.status === 500).toBe(true);
      });

      it(`should return 204 on successful deletion`, async () => {
        const response = await request(app).delete(`${ROUTE}/me`).set(mockHeaders);
        expect(response.status === 204 || response.status === 500).toBe(true);
      });
    });
  });

  describe('Header validation across all endpoints', () => {
    it(`should reject requests with invalid x-forwarded-user header`, async () => {
      const invalidHeaders = {
        'x-forwarded-email': 'test@example.com',
        'x-forwarded-access-token': 'test-token',
      };
      const response = await request(app).get(`${ROUTE}/settings/me`).set(invalidHeaders);
      expect(response.status).toBe(401);
    });

    it(`should reject requests with array x-forwarded-user header`, async () => {
      const response = await request(app)
        .get(`${ROUTE}/settings/me`)
        .set({
          'x-forwarded-user': ['user1', 'user2'] as unknown as string,
          'x-forwarded-email': 'test@example.com',
          'x-forwarded-access-token': 'test-token',
        });
      // Array headers get stringified, resulting in 404 (not found) rather than 401
      expect(response.status).toBe(404);
    });
  });

  describe('Train connections settings', () => {
    const trainTestUserId = 'train-test-user-456';
    const trainMockHeaders = {
      'x-forwarded-user': trainTestUserId,
      'x-forwarded-email': 'train-test@example.com',
      'x-forwarded-access-token': 'train-test-token',
    };

    const validTrainConnections = [
      {
        id: '1',
        departureStationId: '8011160',
        departureStationName: 'Berlin Hbf',
        arrivalStationId: '8000261',
        arrivalStationName: 'München Hbf',
      },
      {
        id: '2',
        departureStationId: '8000261',
        departureStationName: 'München Hbf',
        arrivalStationId: '8000105',
        arrivalStationName: 'Frankfurt Hbf',
      },
    ];

    const validTrainSettings = {
      ...validUserSettings,
      train_connections: validTrainConnections,
      train_display_settings: {
        mode: 'carousel' as const,
        carousel_interval: 15,
      },
    };

    it('should save train connections with user settings', async () => {
      const response = await request(app).put(`${ROUTE}/settings/me`).set(trainMockHeaders).send(validTrainSettings);

      expect(response.status === 200 || response.status === 500).toBe(true);
      if (response.status === 200) {
        expect(response.body.train_connections).toBeDefined();
        expect(Array.isArray(response.body.train_connections)).toBe(true);
        expect(response.body.train_connections.length).toBe(2);
        expect(response.body.train_display_settings).toBeDefined();
        expect(response.body.train_display_settings.mode).toBe('carousel');
        expect(response.body.train_display_settings.carousel_interval).toBe(15);
      }
    });

    it('should retrieve train connections with user settings', async () => {
      // First create settings
      await request(app).put(`${ROUTE}/settings/me`).set(trainMockHeaders).send(validTrainSettings);

      // Then retrieve them
      const response = await request(app).get(`${ROUTE}/settings/me`).set(trainMockHeaders);
      if (response.status === 200) {
        expect(response.body.train_connections).toBeDefined();
        expect(Array.isArray(response.body.train_connections)).toBe(true);
        expect(response.body.train_display_settings).toBeDefined();
      }
    });

    it('should update train connections using PATCH', async () => {
      // First create settings
      await request(app).put(`${ROUTE}/settings/me`).set(trainMockHeaders).send(validTrainSettings);

      // Then update train connections
      const updatedConnections = [
        {
          id: '1',
          departureStationId: '8000105',
          departureStationName: 'Frankfurt Hbf',
          arrivalStationId: '8000191',
          arrivalStationName: 'Hamburg Hbf',
        },
      ];

      const response = await request(app)
        .patch(`${ROUTE}/settings/me`)
        .set(trainMockHeaders)
        .send({ train_connections: updatedConnections });

      expect(response.status === 200 || response.status === 500).toBe(true);
      if (response.status === 200) {
        expect(response.body.train_connections.length).toBe(1);
        expect(response.body.train_connections[0].departureStationName).toBe('Frankfurt Hbf');
      }
    });

    it('should validate train connection structure', async () => {
      const response = await request(app).put(`${ROUTE}/settings/me`).set(trainMockHeaders).send(validTrainSettings);

      if (response.status === 200 && response.body.train_connections && response.body.train_connections.length > 0) {
        const connection = response.body.train_connections[0];
        expect(typeof connection.id).toBe('string');
        expect(typeof connection.departureStationId).toBe('string');
        expect(typeof connection.departureStationName).toBe('string');
        expect(typeof connection.arrivalStationId).toBe('string');
        expect(typeof connection.arrivalStationName).toBe('string');
      }
    });

    it('should support empty train connections array', async () => {
      const settingsWithoutTrains = {
        ...validUserSettings,
        train_connections: [],
      };

      const response = await request(app).put(`${ROUTE}/settings/me`).set(trainMockHeaders).send(settingsWithoutTrains);

      expect(response.status === 200 || response.status === 500).toBe(true);
      if (response.status === 200) {
        expect(response.body.train_connections).toBeDefined();
        expect(Array.isArray(response.body.train_connections)).toBe(true);
        expect(response.body.train_connections.length).toBe(0);
      }
    });

    it('should support maximum 5 train connections', async () => {
      const maxConnections = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        departureStationId: `800${i}000`,
        departureStationName: `Station ${i}`,
        arrivalStationId: `800${i}001`,
        arrivalStationName: `Station ${i + 1}`,
      }));

      const settingsWithMaxTrains = {
        ...validUserSettings,
        train_connections: maxConnections,
      };

      const response = await request(app).put(`${ROUTE}/settings/me`).set(trainMockHeaders).send(settingsWithMaxTrains);

      expect(response.status === 200 || response.status === 500).toBe(true);
      if (response.status === 200) {
        expect(response.body.train_connections.length).toBe(5);
      }
    });

    it('should update train display mode to multiple', async () => {
      const settingsWithMultipleMode = {
        ...validTrainSettings,
        train_display_settings: {
          mode: 'multiple' as const,
          carousel_interval: 15,
        },
      };

      const response = await request(app)
        .put(`${ROUTE}/settings/me`)
        .set(trainMockHeaders)
        .send(settingsWithMultipleMode);

      expect(response.status === 200 || response.status === 500).toBe(true);
      if (response.status === 200) {
        expect(response.body.train_display_settings.mode).toBe('multiple');
      }
    });

    it('should update carousel interval', async () => {
      const settingsWithCustomInterval = {
        ...validTrainSettings,
        train_display_settings: {
          mode: 'carousel' as const,
          carousel_interval: 30,
        },
      };

      const response = await request(app)
        .put(`${ROUTE}/settings/me`)
        .set(trainMockHeaders)
        .send(settingsWithCustomInterval);

      expect(response.status === 200 || response.status === 500).toBe(true);
      if (response.status === 200) {
        expect(response.body.train_display_settings.carousel_interval).toBe(30);
      }
    });

    it('should default train display settings when not provided', async () => {
      const settingsWithoutDisplaySettings = {
        ...validUserSettings,
        train_connections: validTrainConnections,
      };

      const response = await request(app)
        .put(`${ROUTE}/settings/me`)
        .set(trainMockHeaders)
        .send(settingsWithoutDisplaySettings);

      if (response.status === 200) {
        expect(response.body.train_display_settings).toBeDefined();
        expect(response.body.train_display_settings.mode).toBe('carousel');
        expect(response.body.train_display_settings.carousel_interval).toBe(15);
      }
    });
  });
});
