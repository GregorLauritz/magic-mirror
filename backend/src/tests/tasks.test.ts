import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index';
import { hasJsonSchemaValidationErrors } from '../services/json_schema';
import { task_list_schema } from './json_schemas/task_list.test';

const ROUTE = '/api/tasks';

describe(`Unit test the ${ROUTE} route`, () => {
  const mockHeaders = {
    'x-forwarded-user': 'test-user-123',
    'x-forwarded-email': 'test@example.com',
    'x-forwarded-access-token': 'test-token',
  };

  const task_params = {
    ok_count: 10,
    neg_count: -1,
    too_high_count: 150,
    max_valid_count: 100,
  };

  describe(`Unit testing the ${ROUTE} route`, () => {
    it(`should return OK and match schema`, async () => {
      const response = await request(app).get(ROUTE).set(mockHeaders);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(task_list_schema, response.body);
      expect(result).toBe(false);
    });

    it(`should return OK and match schema with valid count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${task_params.ok_count}`).set(mockHeaders);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(task_list_schema, response.body);
      expect(result).toBe(false);
    });

    it(`should return 400 for negative count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${task_params.neg_count}`).set(mockHeaders);
      expect(response.status).toBe(400);
    });

    it(`should return 400 for count exceeding maximum`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${task_params.too_high_count}`).set(mockHeaders);
      expect(response.status).toBe(400);
    });

    it(`should accept maximum valid count`, async () => {
      const response = await request(app).get(`${ROUTE}?count=${task_params.max_valid_count}`).set(mockHeaders);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(task_list_schema, response.body);
      expect(result).toBe(false);
    });

    it(`should accept showCompleted parameter`, async () => {
      const response = await request(app).get(`${ROUTE}?showCompleted=true`).set(mockHeaders);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(task_list_schema, response.body);
      expect(result).toBe(false);
    });

    it(`should accept tasklist_id parameter`, async () => {
      const response = await request(app).get(`${ROUTE}?tasklist_id=@default`).set(mockHeaders);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(task_list_schema, response.body);
      expect(result).toBe(false);
    });

    it(`should return task list with correct structure`, async () => {
      const response = await request(app).get(ROUTE).set(mockHeaders);
      expect(response.status).toBe(200);
      expect('count' in response.body).toBe(true);
      expect('list' in response.body).toBe(true);
      expect(Array.isArray(response.body.list)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });

    it(`should return tasks with required fields`, async () => {
      const response = await request(app).get(ROUTE).set(mockHeaders);
      if (response.status === 200 && response.body.list.length > 0) {
        const task = response.body.list[0];
        expect('id' in task).toBe(true);
        expect('title' in task).toBe(true);
        expect('status' in task).toBe(true);
        expect(typeof task.id).toBe('string');
        expect(typeof task.title).toBe('string');
        expect(typeof task.status).toBe('string');
      }
    });

    it(`should return empty list when no tasks exist`, async () => {
      const response = await request(app).get(ROUTE).set(mockHeaders);
      expect(response.status).toBe(200);
      // Empty list is a valid response
      if (response.body.count === 0) {
        expect(response.body.list.length).toBe(0);
      }
    });

    it(`should handle multiple query parameters`, async () => {
      const response = await request(app)
        .get(`${ROUTE}?count=${task_params.ok_count}&showCompleted=false&tasklist_id=@default`)
        .set(mockHeaders);
      expect(response.status).toBe(200);
      const result = await hasJsonSchemaValidationErrors(task_list_schema, response.body);
      expect(result).toBe(false);
    });
  });
});
