import { describe, expect, it } from 'vitest';
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
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('list');
      expect(Array.isArray(response.body.list)).toBe(true);
    });

    it(`should return OK with count parameter`, async () => {
      const response = await request(app).get(
        `${ROUTE}?cal_id=${birthday_params.valid_cal_id}&count=${birthday_params.ok_count}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.list).toBeDefined();
    });

    it(`should return 400 for negative count`, async () => {
      const response = await request(app).get(
        `${ROUTE}?cal_id=${birthday_params.valid_cal_id}&count=${birthday_params.neg_count}`,
      );
      expect(response.status).toBe(400);
    });

    it(`should return 400 for too high count`, async () => {
      const response = await request(app).get(
        `${ROUTE}?cal_id=${birthday_params.valid_cal_id}&count=${birthday_params.too_high_count}`,
      );
      expect(response.status).toBe(400);
    });

    it(`should return 400 when cal_id is missing`, async () => {
      const response = await request(app).get(ROUTE);
      expect(response.status).toBe(400);
    });

    it(`should validate birthday structure in response`, async () => {
      const response = await request(app).get(`${ROUTE}?cal_id=${birthday_params.valid_cal_id}`);
      if (response.status === 200 && response.body.list.length > 0) {
        const birthday = response.body.list[0];
        expect(birthday).toHaveProperty('name');
        expect(birthday).toHaveProperty('date');
        expect(typeof birthday.name).toBe('string');
        expect(typeof birthday.date).toBe('string');
      }
    });
  });
});
