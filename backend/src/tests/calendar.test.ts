import assert from 'assert';
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
      assert.equal(response.status, 200);
      const result = await hasJsonSchemaValidationErrors(event_list_schema, response.body);
      return assert.equal(result, false);
    });
    it(`should return OK and match schema with count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${event_list_params.ok_count}`);
      assert.equal(response.status, 200);
      const result = await hasJsonSchemaValidationErrors(event_list_schema, response.body);
      return assert.equal(result, false);
    });
    it(`should return 400 for negative count`, async () => {
      request(app)
        .get(`${ROUTE}?count=${event_list_params.neg_count}`)
        .then((response) => assert.equal(response.status, 200));
    });
    it(`should return 400 for too high count`, async () => {
      request(app)
        .get(`${ROUTE}?count=${event_list_params.too_high_count}`)
        .then((response) => assert.equal(response.status, 200));
    });
  });
  describe(`Unit testing the ${ROUTE}/next route`, () => {
    it(`should return OK and match schema`, async () => {
      const response = await request(app).get(`${ROUTE}/next`);
      assert.equal(response.status, 200);
      const result = await hasJsonSchemaValidationErrors(event_schema, response.body);
      return assert.equal(result, false);
    });
  });
});
