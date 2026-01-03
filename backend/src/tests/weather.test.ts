import assert from 'assert';
import request from 'supertest';
import app from 'index';
import { hasJsonSchemaValidationErrors } from 'services/json_schema';
import { weather_current_schema } from './json_schemas/current_weather.test';
import { weather_forecast_schema } from './json_schemas/weather_forecast.test';

const ROUTE = '/weather';

describe(`Unit test the ${ROUTE} route`, () => {
  const icon_params = {
    ok_icon: '01d',
    fault_icon: '00d',
  };

  const location_params = {
    ok_latitude: 48.7751458,
    ok_longitude: 9.165287,
    fault_latitude: 948.7751458,
    fault_longitude: -900.165287,
  };

  const forecast_params = {
    okay_days: 5,
    too_many_days: 1000,
    neg_days: -1,
  };

  describe(`Unit testing the ${ROUTE}/icon route`, () => {
    it(`should return OK status for icon ${icon_params.ok_icon}`, async () => {
      const response = await request(app).get(`${ROUTE}/icon/${icon_params.ok_icon}`);
      assert.equal(response.status, 200);
    });
    it(`should return 404 status for icon ${icon_params.fault_icon}`, async () => {
      const response = await request(app).get(`${ROUTE}/icon/${icon_params.fault_icon}`);
      assert.equal(response.status, 404);
    });
  });

  describe(`Unit testing the ${ROUTE}/current route`, () => {
    it(`should return OK status for ok test params`, async () => {
      const response = await request(app).get(
        `${ROUTE}/current?latitude=${location_params.ok_latitude}&longitude=${location_params.ok_longitude}`,
      );
      assert.equal(response.status, 200);
      const result = await hasJsonSchemaValidationErrors(weather_current_schema, response.body);
      assert.equal(result, false);
    });
    it(`should return 400 status for bad test params`, async () => {
      const response = await request(app).get(
        `${ROUTE}/current?latitude=${location_params.fault_latitude}&longitude=${location_params.fault_longitude}`,
      );
      assert.equal(response.status, 400);
    });
  });

  describe(`Unit testing the ${ROUTE}/forecast route`, () => {
    it(`should return OK status for ok test params`, async () => {
      const response = await request(app).get(
        `${ROUTE}/forecast?latitude=${location_params.ok_latitude}&longitude=${location_params.ok_longitude}&days=${forecast_params.okay_days}`,
      );
      assert.equal(response.status, 200);
      const result = await hasJsonSchemaValidationErrors(weather_forecast_schema, response.body);
      return assert.equal(result, false);
    });
    it(`should return 400 status for bad test params`, async () => {
      const response = await request(app).get(
        `${ROUTE}/forecast?latitude=${location_params.fault_latitude}&longitude=${location_params.fault_longitude}`,
      );
      assert.equal(response.status, 400);
    });
    it(`should return 400 status for 1000 day forcast`, async () => {
      const response = await request(app).get(
        `${ROUTE}/forecast?latitude=${location_params.ok_latitude}&longitude=${location_params.ok_longitude}&days=${forecast_params.too_many_days}`,
      );
      assert.equal(response.status, 400);
    });
    it(`should return 400 status for negative day forcast`, async () => {
      const response = await request(app).get(
        `${ROUTE}/forecast?latitude=${location_params.ok_latitude}&longitude=${location_params.ok_longitude}&days=${forecast_params.neg_days}`,
      );
      assert.equal(response.status, 400);
    });
  });
});
