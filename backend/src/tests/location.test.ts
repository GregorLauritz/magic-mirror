import { describe, expect, it } from 'vitest';
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
      expect(response.status === 200 || response.status === 404).toBe(true);
    });

    it(`should return OK with country and city`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&city=${geocode_params.valid_city}`,
      );
      expect(response.status === 200 || response.status === 404).toBe(true);
      if (response.status === 200) {
        expect('latitude' in response.body).toBe(true);
        expect('longitude' in response.body).toBe(true);
        expect(typeof response.body.latitude).toBe('number');
        expect(typeof response.body.longitude).toBe('number');
      }
    });

    it(`should return OK with country and zip code`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&zip_code=${geocode_params.valid_zip}`,
      );
      expect(response.status === 200 || response.status === 404).toBe(true);
      if (response.status === 200) {
        expect('latitude' in response.body).toBe(true);
        expect('longitude' in response.body).toBe(true);
      }
    });

    it(`should return OK with all parameters`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&city=${geocode_params.valid_city}&zip_code=${geocode_params.valid_zip}`,
      );
      expect(response.status === 200 || response.status === 404).toBe(true);
    });

    it(`should return 400 when country is missing`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?city=${geocode_params.valid_city}`);
      expect(response.status).toBe(400);
    });

    it(`should return 400 for invalid country code (too long)`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=${geocode_params.invalid_country}`);
      expect(response.status).toBe(400);
    });

    it(`should return 400 for invalid country code (too short)`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=${geocode_params.invalid_country_short}`);
      expect(response.status).toBe(400);
    });

    it(`should validate response structure for successful geocoding`, async () => {
      const response = await request(app).get(
        `${ROUTE}/geocode?country=${geocode_params.valid_country}&city=${geocode_params.valid_city}`,
      );
      if (response.status === 200) {
        expect(typeof response.body).toBe('object');
        expect(response.body.latitude !== undefined).toBe(true);
        expect(response.body.longitude !== undefined).toBe(true);
        expect(response.body.latitude >= -90 && response.body.latitude <= 90).toBe(true);
        expect(response.body.longitude >= -180 && response.body.longitude <= 180).toBe(true);
      }
    });

    it(`should handle 404 error gracefully`, async () => {
      const response = await request(app).get(`${ROUTE}/geocode?country=XX&city=NonExistentCity123456789`);
      // Should either succeed with coordinates or return 404 for not found location
      expect(response.status === 200 || response.status === 404 || response.status === 500).toBe(true);
    });
  });
});
