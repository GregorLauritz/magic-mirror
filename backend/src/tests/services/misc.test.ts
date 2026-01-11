import { expect } from 'chai';
import { describe, it } from 'mocha';
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

      expect(requestQueryContainsParam(req, 'testParam')).to.be.true;
      expect(requestQueryContainsParam(req, 'anotherParam')).to.be.true;
    });

    it('should return false when query parameter does not exist', () => {
      const req = {
        query: {
          testParam: 'value',
        },
      } as unknown as Request;

      expect(requestQueryContainsParam(req, 'nonExistent')).to.be.false;
    });

    it('should return false for empty query object', () => {
      const req = {
        query: {},
      } as unknown as Request;

      expect(requestQueryContainsParam(req, 'anyParam')).to.be.false;
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

      expect(requestContainsParam(req, 'id')).to.be.true;
      expect(requestContainsParam(req, 'userId')).to.be.true;
    });

    it('should return false when route parameter does not exist', () => {
      const req = {
        params: {
          id: '123',
        },
      } as unknown as Request;

      expect(requestContainsParam(req, 'nonExistent')).to.be.false;
    });

    it('should return false for empty params object', () => {
      const req = {
        params: {},
      } as unknown as Request;

      expect(requestContainsParam(req, 'anyParam')).to.be.false;
    });
  });
});
