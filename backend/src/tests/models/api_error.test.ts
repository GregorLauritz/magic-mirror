import { describe, expect, it } from 'vitest';
import { ApiError } from '../../models/api/api_error';

describe('ApiError Model', () => {
  describe('Constructor', () => {
    it('should create ApiError with message only', () => {
      const error = new ApiError('Test error message');
      expect(error.message).toBe('Test error message');
      expect(error.status).toBe(500);
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError with message and custom status', () => {
      const error = new ApiError('Not found', undefined, 404);
      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
    });

    it('should create ApiError with thrown error', () => {
      const thrownError = new Error('Original error');
      const error = new ApiError('Wrapper error', thrownError, 500);
      expect(error.message).toBe('Wrapper error');
      expect(error.thrownError).toBe(thrownError);
      expect(error.status).toBe(500);
    });

    it('should create Error object from message if no thrown error provided', () => {
      const error = new ApiError('Test message');
      expect(error.thrownError).toBeInstanceOf(Error);
      expect(error.thrownError.message).toBe('Test message');
    });
  });

  describe('Getters', () => {
    it('should return correct status via getter', () => {
      const error = new ApiError('Test', undefined, 400);
      expect(error.status).toBe(400);
    });

    it('should return correct thrownError via getter', () => {
      const thrownError = new Error('Thrown');
      const error = new ApiError('Test', thrownError, 500);
      expect(error.thrownError).toBe(thrownError);
    });
  });

  describe('Error Inheritance', () => {
    it('should be instance of Error', () => {
      const error = new ApiError('Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instance of ApiError', () => {
      const error = new ApiError('Test');
      expect(error).toBeInstanceOf(ApiError);
    });

    it('should have correct name property', () => {
      const error = new ApiError('Test');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('Common HTTP Status Codes', () => {
    it('should handle 400 Bad Request', () => {
      const error = new ApiError('Bad request', undefined, 400);
      expect(error.status).toBe(400);
    });

    it('should handle 401 Unauthorized', () => {
      const error = new ApiError('Unauthorized', undefined, 401);
      expect(error.status).toBe(401);
    });

    it('should handle 403 Forbidden', () => {
      const error = new ApiError('Forbidden', undefined, 403);
      expect(error.status).toBe(403);
    });

    it('should handle 404 Not Found', () => {
      const error = new ApiError('Not found', undefined, 404);
      expect(error.status).toBe(404);
    });

    it('should handle 500 Internal Server Error (default)', () => {
      const error = new ApiError('Server error');
      expect(error.status).toBe(500);
    });
  });
});
