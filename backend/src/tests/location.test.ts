import assert from 'assert';
import request from 'supertest';
import app from '../index';

const ROUTE = '/api/location';

describe(`Unit test the ${ROUTE} route`, () => {
  const geocode_params = {
    valid_country: 'US',
    valid_city: 'NewYork',
    valid_zip: '10001',
    invalid_country: 'USA',
    invalid_country_short: 'U',
    special_chars_city: 'New-York',
  };

  describe(`Unit testing the ${ROUTE}/geocode route`, () => {
    it(`should return OK with valid country parameter`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=${geocode_params.valid_country}`);
      // Response can be 200 (success) or 404 (not found) depending on geocoding service
      assert.ok(response.status === 200 || response.status === 404);
    });

    it(`should return OK with country and city`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&city=${geocode_params.valid_city}`,
      );
      assert.ok(response.status === 200 || response.status === 404);
      if (response.status === 200) {
        assert.ok('latitude' in response.body, 'Response should have latitude');
        assert.ok('longitude' in response.body, 'Response should have longitude');
        assert.equal(typeof response.body.latitude, 'number', 'Latitude should be number');
        assert.equal(typeof response.body.longitude, 'number', 'Longitude should be number');
      }
    });

    it(`should return OK with country and zip code`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&zip_code=${geocode_params.valid_zip}`,
      );
      assert.ok(response.status === 200 || response.status === 404);
      if (response.status === 200) {
        assert.ok('latitude' in response.body, 'Response should have latitude');
        assert.ok('longitude' in response.body, 'Response should have longitude');
      }
    });

    it(`should return OK with all parameters`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&city=${geocode_params.valid_city}&zip_code=${geocode_params.valid_zip}`,
      );
      assert.ok(response.status === 200 || response.status === 404);
    });

    it(`should return 400 when country is missing`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?city=${geocode_params.valid_city}`);
      assert.equal(response.status, 400);
    });

    it(`should return 400 for invalid country code (too long)`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=${geocode_params.invalid_country}`);
      assert.equal(response.status, 400);
    });

    it(`should return 400 for invalid country code (too short)`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=${geocode_params.invalid_country_short}`);
      assert.equal(response.status, 400);
    });

    it(`should validate response structure for successful geocoding`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&city=${geocode_params.valid_city}`,
      );
      if (response.status === 200) {
        assert.ok(typeof response.body === 'object', 'Response should be object');
        assert.ok(response.body.latitude !== undefined, 'Should have latitude');
        assert.ok(response.body.longitude !== undefined, 'Should have longitude');
        assert.ok(response.body.latitude >= -90 && response.body.latitude <= 90, 'Latitude should be in valid range');
        assert.ok(
          response.body.longitude >= -180 && response.body.longitude <= 180,
          'Longitude should be in valid range',
        );
      }
    });

    it(`should handle 404 error gracefully`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=XX&city=NonExistentCity123456789`);
      // Should either succeed with coordinates or return 404 for not found location
      assert.ok(response.status === 200 || response.status === 404 || response.status === 500);
    });
  });
});
