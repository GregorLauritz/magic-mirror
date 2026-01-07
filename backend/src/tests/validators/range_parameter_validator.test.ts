import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Request, Response, NextFunction } from 'express';
import { RangeParameterValidator } from '../../services/validators/range_parameter_validator';
import { EParamType } from '../../services/validators/parameter_validator';
import { ApiError } from '../../models/api/api_error';

describe('RangeParameterValidator', () => {
  describe('Query Parameter Validation', () => {
    it('should pass validation for value within range', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: { count: '50' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should pass validation for value at minimum', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: { count: '1' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should pass validation for value at maximum', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: { count: '100' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation for value below minimum', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: { count: '0' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        expect((err as ApiError).message).to.include('out of range');
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation for value above maximum', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: { count: '101' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        expect((err as ApiError).message).to.include('out of range');
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation for negative values when not in range', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: { count: '-5' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        done();
      };

      validator.validate(req, res, next);
    });
  });

  describe('Required Parameter Handling', () => {
    it('should fail validation when required parameter is missing', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, true);
      const req = {
        query: {},
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        expect((err as ApiError).message).to.include('required');
        done();
      };

      validator.validate(req, res, next);
    });

    it('should pass validation when optional parameter is missing', (done) => {
      const validator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, false);
      const req = {
        query: {},
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });
  });

  describe('Route Parameter Validation', () => {
    it('should validate route parameters correctly', (done) => {
      const validator = new RangeParameterValidator('id', { min: 1, max: 1000 }, EParamType.request, true);
      const req = {
        params: { id: '500' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail for route parameter out of range', (done) => {
      const validator = new RangeParameterValidator('id', { min: 1, max: 1000 }, EParamType.request, true);
      const req = {
        params: { id: '2000' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        done();
      };

      validator.validate(req, res, next);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative range correctly', (done) => {
      const validator = new RangeParameterValidator('offset', { min: -100, max: -1 }, EParamType.query, true);
      const req = {
        query: { offset: '-50' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should handle zero in range', (done) => {
      const validator = new RangeParameterValidator('value', { min: 0, max: 10 }, EParamType.query, true);
      const req = {
        query: { value: '0' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should handle very large numbers in range', (done) => {
      const validator = new RangeParameterValidator('bignum', { min: 1, max: 1000000 }, EParamType.query, true);
      const req = {
        query: { bignum: '999999' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });
  });
});
