import { describe, it, expect } from 'vitest';
import { requestContainsParam, requestQueryContainsParam } from '../../services/misc';
import { Request } from 'express';

describe('Miscellaneous Service Utilities', () => {
  describe('requestQueryContainsParam', () => {
    it('should return true when query parameter exists', () => {
      const req = {
        query: {
          testParam: 'value',
          anotherParam: '123',
        },
      } as unknown as Request;

      expect(requestQueryContainsParam(req, 'testParam')).toBe(true);
      expect(requestQueryContainsParam(req, 'anotherParam')).toBe(true);
    });

    it('should return false when query parameter does not exist', () => {
      const req = {
        query: {
          testParam: 'value',
        },
      } as unknown as Request;

      expect(requestQueryContainsParam(req, 'nonExistent')).toBe(false);
    });

    it('should return false for empty query object', () => {
      const req = {
        query: {},
      } as unknown as Request;

      expect(requestQueryContainsParam(req, 'anyParam')).toBe(false);
    });
  });

  describe('requestContainsParam', () => {
    it('should return true when route parameter exists', () => {
      const req = {
        params: {
          id: '123',
          userId: 'abc',
        },
      } as unknown as Request;

      expect(requestContainsParam(req, 'id')).toBe(true);
      expect(requestContainsParam(req, 'userId')).toBe(true);
    });

    it('should return false when route parameter does not exist', () => {
      const req = {
        params: {
          id: '123',
        },
      } as unknown as Request;

      expect(requestContainsParam(req, 'nonExistent')).toBe(false);
    });

    it('should return false for empty params object', () => {
      const req = {
        params: {},
      } as unknown as Request;

      expect(requestContainsParam(req, 'anyParam')).toBe(false);
    });
  });
});
