import assert from 'assert';
import request from 'supertest';
import app from '../index';

const ROUTE = '/api/birthdays';

describe(`Unit test the ${ROUTE} route`, () => {
  const birthday_params = {
    valid_cal_id: 'primary',
    ok_count: 20,
    neg_count: -2,
    too_high_count: 2000,
  };

  describe(`Unit testing the ${ROUTE} route`, () => {
    it(`should return OK and valid response structure with cal_id`, async () => {
      const response = await request(app).get(`${ROUTE}?cal_id=${birthday_params.valid_cal_id}`);
      assert.equal(response.status, 200);
      assert.ok(response.body, 'Response body should exist');
      assert.ok('count' in response.body, 'Response should have count property');
      assert.ok('list' in response.body, 'Response should have list property');
      assert.ok(Array.isArray(response.body.list), 'List should be an array');
    });

    it(`should return OK with count parameter`, async () => {
      const response = await request(app).get(
        `${ROUTE}?cal_id=${birthday_params.valid_cal_id}&count=${birthday_params.ok_count}`,
      );
      assert.equal(response.status, 200);
      assert.ok(response.body.list, 'Response should have list');
    });

    it(`should return 400 for negative count`, async () => {
      const response = await request(app).get(
        `${ROUTE}?cal_id=${birthday_params.valid_cal_id}&count=${birthday_params.neg_count}`,
      );
      assert.equal(response.status, 400);
    });

    it(`should return 400 for too high count`, async () => {
      const response = await request(app).get(
        `${ROUTE}?cal_id=${birthday_params.valid_cal_id}&count=${birthday_params.too_high_count}`,
      );
      assert.equal(response.status, 400);
    });

    it(`should return 400 when cal_id is missing`, async () => {
      const response = await request(app).get(ROUTE);
      assert.equal(response.status, 400);
    });

    it(`should validate birthday structure in response`, async () => {
      const response = await request(app).get(`${ROUTE}?cal_id=${birthday_params.valid_cal_id}`);
      if (response.status === 200 && response.body.list.length > 0) {
        const birthday = response.body.list[0];
        assert.ok('name' in birthday, 'Birthday should have name property');
        assert.ok('date' in birthday, 'Birthday should have date property');
        assert.equal(typeof birthday.name, 'string', 'Birthday name should be string');
        assert.equal(typeof birthday.date, 'string', 'Birthday date should be string');
      }
    });
  });
});
