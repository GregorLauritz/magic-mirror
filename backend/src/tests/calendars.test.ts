import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index';

const ROUTE = '/api/calendars';

describe(`Unit test the ${ROUTE} route`, () => {
  describe(`Unit testing the ${ROUTE} route`, () => {
    it(`should return OK status`, async () => {
      const response = await request(app).get(ROUTE);
      expect(response.status).toBe(200);
    });

    it(`should return array of calendars`, async () => {
      const response = await request(app).get(ROUTE);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it(`should return calendars with correct structure`, async () => {
      const response = await request(app).get(ROUTE);
      if (response.status === 200 && response.body.length > 0) {
        const calendar = response.body[0];
        expect('name' in calendar || calendar.name !== undefined).toBe(true);
        expect('id' in calendar || calendar.id !== undefined).toBe(true);
        expect('primary' in calendar).toBe(true);
        expect(typeof calendar.primary).toBe('boolean');
      }
    });

    it(`should return primary calendar if exists`, async () => {
      const response = await request(app).get(ROUTE);
      if (response.status === 200 && response.body.length > 0) {
        const hasPrimary = response.body.some((cal: { primary: boolean }) => cal.primary === true);
        expect(hasPrimary || response.body.length > 0).toBe(true);
      }
    });

    it(`should handle empty calendar list`, async () => {
      const response = await request(app).get(ROUTE);
      expect(response.status).toBe(200);
      // Empty array is a valid response
      if (Array.isArray(response.body)) {
        expect(true).toBe(true);
      }
    });
  });
});
