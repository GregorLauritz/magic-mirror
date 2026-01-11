import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getAccessToken, getAuthenticationHeader, getUserEmail, getUserId } from '../../services/headers';
import { ApiError } from '../../models/api/api_error';
import { IncomingHttpHeaders } from 'http';

describe('Header Utilities', () => {
  describe('getUserId', () => {
    it('should extract user ID from valid header', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-user': 'user123',
      };
      const result = getUserId(headers);
      expect(result).to.equal('user123');
    });

    it('should throw ApiError when header is missing', () => {
      const headers: IncomingHttpHeaders = {};
      expect(() => getUserId(headers)).to.throw(ApiError);
    });

    it('should throw ApiError when header is not a string', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-user': ['array', 'value'],
      };
      expect(() => getUserId(headers)).to.throw(ApiError);
    });

    it('should throw ApiError with status 401', () => {
      const headers: IncomingHttpHeaders = {};
      try {
        getUserId(headers);
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(401);
      }
    });
  });

  describe('getUserEmail', () => {
    it('should extract email from valid header', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-email': 'user@example.com',
      };
      const result = getUserEmail(headers);
      expect(result).to.equal('user@example.com');
    });

    it('should throw ApiError when header is missing', () => {
      const headers: IncomingHttpHeaders = {};
      expect(() => getUserEmail(headers)).to.throw(ApiError);
    });

    it('should throw ApiError when header is not a string', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-email': ['email1@example.com', 'email2@example.com'],
      };
      expect(() => getUserEmail(headers)).to.throw(ApiError);
    });

    it('should throw ApiError with status 401', () => {
      const headers: IncomingHttpHeaders = {};
      try {
        getUserEmail(headers);
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(401);
      }
    });
  });

  describe('getAccessToken', () => {
    it('should extract access token from valid header', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-access-token': 'token123',
      };
      const result = getAccessToken(headers);
      expect(result).to.equal('token123');
    });

    it('should throw ApiError when header is missing', () => {
      const headers: IncomingHttpHeaders = {};
      expect(() => getAccessToken(headers)).to.throw(ApiError);
    });

    it('should throw ApiError when header is not a string', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-access-token': ['token1', 'token2'],
      };
      expect(() => getAccessToken(headers)).to.throw(ApiError);
    });

    it('should throw ApiError with status 401', () => {
      const headers: IncomingHttpHeaders = {};
      try {
        getAccessToken(headers);
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(401);
      }
    });
  });

  describe('getAuthenticationHeader', () => {
    it('should create Authorization header from access token', () => {
      const headers: IncomingHttpHeaders = {
        'x-forwarded-access-token': 'mytoken123',
      };
      const result = getAuthenticationHeader(headers);
      expect(result).to.deep.equal({
        headers: {
          Authorization: 'Bearer mytoken123',
        },
      });
    });

    it('should throw ApiError when access token header is missing', () => {
      const headers: IncomingHttpHeaders = {};
      expect(() => getAuthenticationHeader(headers)).to.throw(ApiError);
    });
  });
});
