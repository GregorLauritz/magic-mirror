import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index';
import { hasJsonSchemaValidationErrors } from '../services/json_schema';
import { event_list_schema } from './json_schemas/event_list.test';
import { event_schema } from './json_schemas/event.test';

const ROUTE = '/api/events';

describe(`Unit test the ${ROUTE} route`, () => {
  const event_list_params = {
    ok_count: 20,
    neg_count: -2,
    too_high_count: 2000,
  };

  describe(`Unit testing the ${ROUTE} route`, () => {
    it(`should return OK and match schema`, async () => {
      const response = await request(app).get(ROUTE);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(event_list_schema, response.body);
      expect(result).toBe(false);
    });
    it(`should return OK and match schema with count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${event_list_params.ok_count}`);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(event_list_schema, response.body);
      expect(result).toBe(false);
    });
    it(`should return 400 for negative count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${event_list_params.neg_count}`);
      expect(response.status).toBe(200);
    });
    it(`should return 400 for too high count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${event_list_params.too_high_count}`);
      expect(response.status).toBe(200);
    });
  });
  describe(`Unit testing the ${ROUTE}/next route`, () => {
    it(`should return OK and match schema`, async () => {
      const response = await request(app).get(`${ROUTE}/next`);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(event_schema, response.body);
      expect(result).toBe(false);
    });
  });
});
