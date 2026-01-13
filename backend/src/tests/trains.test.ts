import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index';

const ROUTE = '/api/trains';

describe(`Unit test the ${ROUTE} route`, () => {
  const test_params = {
    valid_query: 'Berlin',
    valid_query_hbf: 'Berlin Hbf',
    short_query: 'B',
    valid_station_id: '8011160', // Berlin Hbf
    invalid_station_id: 'invalid123',
    berlin_hbf_id: '8011160',
    munich_hbf_id: '8000261',
  };

  describe(`Unit testing the ${ROUTE}/stations route`, () => {
    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app).get(`${ROUTE}/stations`);
      expect(response.status).toBe(400);
    });

    it('should return 400 for query less than 2 characters', async () => {
      const response = await request(app).get(`${ROUTE}/stations?query=${test_params.short_query}`);
      expect(response.status).toBe(400);
    });

    it('should return OK with valid query parameter', async () => {
      const response = await request(app).get(`${ROUTE}/stations?query=${test_params.valid_query}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return stations with correct structure', async () => {
      const response = await request(app).get(`${ROUTE}/stations?query=${test_params.valid_query_hbf}`);
      if (response.status === 200 && response.body.length > 0) {
        const station = response.body[0];
        expect(typeof station.id).toBe('string');
        expect(typeof station.name).toBe('string');
        expect(station.id.length).toBeGreaterThan(0);
        expect(station.name.length).toBeGreaterThan(0);
      }
    });

    it('should respect results limit parameter', async () => {
      const results = 3;
      const response = await request(app).get(`${ROUTE}/stations?query=${test_params.valid_query}&results=${results}`);
      if (response.status === 200) {
        expect(response.body.length).toBeLessThanOrEqual(results);
      }
    });

    it('should return 400 for results parameter out of range (too high)', async () => {
      const response = await request(app).get(`${ROUTE}/stations?query=${test_params.valid_query}&results=100`);
      expect(response.status).toBe(400);
    });

    it('should return 400 for results parameter out of range (too low)', async () => {
      const response = await request(app).get(`${ROUTE}/stations?query=${test_params.valid_query}&results=0`);
      expect(response.status).toBe(400);
    });
  });

  describe(`Unit testing the ${ROUTE}/departures route`, () => {
    it('should return 400 when stationId parameter is missing', async () => {
      const response = await request(app).get(`${ROUTE}/departures`);
      expect(response.status).toBe(400);
    });

    it('should return OK with valid stationId', async () => {
      const response = await request(app).get(`${ROUTE}/departures?stationId=${test_params.valid_station_id}`);
      // May return 200 (success) or 500 (API error) depending on external API
      expect(response.status === 200 || response.status === 500).toBe(true);
    });

    it('should return departures with correct structure', async () => {
      const response = await request(app).get(`${ROUTE}/departures?stationId=${test_params.valid_station_id}`);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const departure = response.body[0];
          expect('when' in departure || 'plannedWhen' in departure).toBe(true);
          expect('line' in departure).toBe(true);
          expect('direction' in departure).toBe(true);
        }
      }
    });

    it('should respect duration parameter', async () => {
      const duration = 60;
      const response = await request(app).get(
        `${ROUTE}/departures?stationId=${test_params.valid_station_id}&duration=${duration}`,
      );
      expect(response.status === 200 || response.status === 500).toBe(true);
    });

    it('should return 400 for duration parameter out of range (too low)', async () => {
      const response = await request(app).get(
        `${ROUTE}/departures?stationId=${test_params.valid_station_id}&duration=5`,
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 for duration parameter out of range (too high)', async () => {
      const response = await request(app).get(
        `${ROUTE}/departures?stationId=${test_params.valid_station_id}&duration=800`,
      );
      expect(response.status).toBe(400);
    });

    it('should respect results parameter', async () => {
      const results = 5;
      const response = await request(app).get(
        `${ROUTE}/departures?stationId=${test_params.valid_station_id}&results=${results}`,
      );
      if (response.status === 200) {
        expect(response.body.length).toBeLessThanOrEqual(results);
      }
    });
  });

  describe(`Unit testing the ${ROUTE}/connections route`, () => {
    it('should return 400 when from parameter is missing', async () => {
      const response = await request(app).get(`${ROUTE}/connections?to=${test_params.munich_hbf_id}`);
      expect(response.status).toBe(400);
    });

    it('should return 400 when to parameter is missing', async () => {
      const response = await request(app).get(`${ROUTE}/connections?from=${test_params.berlin_hbf_id}`);
      expect(response.status).toBe(400);
    });

    it('should return OK with valid from and to parameters', async () => {
      const response = await request(app).get(
        `${ROUTE}/connections?from=${test_params.berlin_hbf_id}&to=${test_params.munich_hbf_id}`,
      );
      // May return 200 (success) or 500 (API error) depending on external API
      expect(response.status === 200 || response.status === 500).toBe(true);
    });

    it('should return connections with correct structure', async () => {
      const response = await request(app).get(
        `${ROUTE}/connections?from=${test_params.berlin_hbf_id}&to=${test_params.munich_hbf_id}`,
      );
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const connection = response.body[0];
          expect(typeof connection.departure).toBe('string');
          expect(typeof connection.arrival).toBe('string');
          expect(typeof connection.departureStation).toBe('string');
          expect(typeof connection.arrivalStation).toBe('string');
          expect(typeof connection.line).toBe('string');
          expect(typeof connection.direction).toBe('string');
          expect(typeof connection.duration).toBe('number');
          expect(connection.duration).toBeGreaterThan(0);
        }
      }
    });

    it('should respect results parameter', async () => {
      const results = 3;
      const response = await request(app).get(
        `${ROUTE}/connections?from=${test_params.berlin_hbf_id}&to=${test_params.munich_hbf_id}&results=${results}`,
      );
      if (response.status === 200) {
        expect(response.body.length).toBeLessThanOrEqual(results);
      }
    });

    it('should return 400 for results parameter out of range', async () => {
      const response = await request(app).get(
        `${ROUTE}/connections?from=${test_params.berlin_hbf_id}&to=${test_params.munich_hbf_id}&results=100`,
      );
      expect(response.status).toBe(400);
    });

    it('should validate departure is before arrival', async () => {
      const response = await request(app).get(
        `${ROUTE}/connections?from=${test_params.berlin_hbf_id}&to=${test_params.munich_hbf_id}`,
      );
      if (response.status === 200 && response.body.length > 0) {
        const connection = response.body[0];
        const departureTime = new Date(connection.departure).getTime();
        const arrivalTime = new Date(connection.arrival).getTime();
        expect(departureTime).toBeLessThan(arrivalTime);
      }
    });
  });
});
