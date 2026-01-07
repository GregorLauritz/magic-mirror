import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ApiError } from '../../models/api/api_error';

describe('ApiError Model', () => {
  describe('Constructor', () => {
    it('should create ApiError with message only', () => {
      const error = new ApiError('Test error message');
      expect(error.message).to.equal('Test error message');
      expect(error.status).to.equal(500);
      expect(error.name).to.equal('ApiError');
    });

    it('should create ApiError with message and custom status', () => {
      const error = new ApiError('Not found', undefined, 404);
      expect(error.message).to.equal('Not found');
      expect(error.status).to.equal(404);
    });

    it('should create ApiError with thrown error', () => {
      const thrownError = new Error('Original error');
      const error = new ApiError('Wrapper error', thrownError, 500);
      expect(error.message).to.equal('Wrapper error');
      expect(error.thrownError).to.equal(thrownError);
      expect(error.status).to.equal(500);
    });

    it('should create Error object from message if no thrown error provided', () => {
      const error = new ApiError('Test message');
      expect(error.thrownError).to.be.instanceOf(Error);
      expect(error.thrownError.message).to.equal('Test message');
    });
  });

  describe('Getters', () => {
    it('should return correct status via getter', () => {
      const error = new ApiError('Test', undefined, 400);
      expect(error.status).to.equal(400);
    });

    it('should return correct thrownError via getter', () => {
      const thrownError = new Error('Thrown');
      const error = new ApiError('Test', thrownError, 500);
      expect(error.thrownError).to.equal(thrownError);
    });
  });

  describe('Error Inheritance', () => {
    it('should be instance of Error', () => {
      const error = new ApiError('Test');
      expect(error).to.be.instanceOf(Error);
    });

    it('should be instance of ApiError', () => {
      const error = new ApiError('Test');
      expect(error).to.be.instanceOf(ApiError);
    });

    it('should have correct name property', () => {
      const error = new ApiError('Test');
      expect(error.name).to.equal('ApiError');
    });
  });

  describe('Common HTTP Status Codes', () => {
    it('should handle 400 Bad Request', () => {
      const error = new ApiError('Bad request', undefined, 400);
      expect(error.status).to.equal(400);
    });

    it('should handle 401 Unauthorized', () => {
      const error = new ApiError('Unauthorized', undefined, 401);
      expect(error.status).to.equal(401);
    });

    it('should handle 403 Forbidden', () => {
      const error = new ApiError('Forbidden', undefined, 403);
      expect(error.status).to.equal(403);
    });

    it('should handle 404 Not Found', () => {
      const error = new ApiError('Not found', undefined, 404);
      expect(error.status).to.equal(404);
    });

    it('should handle 500 Internal Server Error (default)', () => {
      const error = new ApiError('Server error');
      expect(error.status).to.equal(500);
    });
  });
});
