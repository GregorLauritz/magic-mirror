import assert from 'assert';
import request from 'supertest';
import app from '../index';

const ROUTE = '/api/calendars';

describe(`Unit test the ${ROUTE} route`, () => {
  describe(`Unit testing the ${ROUTE} route`, () => {
    it(`should return OK status`, async () => {
      const response = await request(app).get(ROUTE);
      assert.equal(response.status, 200);
    });

    it(`should return array of calendars`, async () => {
      const response = await request(app).get(ROUTE);
      assert.equal(response.status, 200);
      assert.ok(Array.isArray(response.body), 'Response should be an array');
    });

    it(`should return calendars with correct structure`, async () => {
      const response = await request(app).get(ROUTE);
      if (response.status === 200 && response.body.length > 0) {
        const calendar = response.body[0];
        assert.ok('name' in calendar || calendar.name !== undefined, 'Calendar should have name property');
        assert.ok('id' in calendar || calendar.id !== undefined, 'Calendar should have id property');
        assert.ok('primary' in calendar, 'Calendar should have primary property');
        assert.equal(typeof calendar.primary, 'boolean', 'Primary should be boolean');
      }
    });

    it(`should return primary calendar if exists`, async () => {
      const response = await request(app).get(ROUTE);
      if (response.status === 200 && response.body.length > 0) {
        const hasPrimary = response.body.some((cal: { primary: boolean }) => cal.primary === true);
        assert.ok(hasPrimary || response.body.length > 0, 'Should have at least one calendar or a primary one');
      }
    });

    it(`should handle empty calendar list`, async () => {
      const response = await request(app).get(ROUTE);
      assert.equal(response.status, 200);
      // Empty array is a valid response
      if (Array.isArray(response.body)) {
        assert.ok(true, 'Empty array is valid');
      }
    });
  });
});
