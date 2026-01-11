import { expect } from 'chai';
import { describe, it } from 'mocha';
import { NextFunction, Request, Response } from 'express';
import { CustomParameterValidator } from '../../services/validators/custom_parameter_validator';
import { EParamType } from '../../services/validators/parameter_validator';
import { ApiError } from '../../models/api/api_error';

describe('CustomParameterValidator', () => {
  describe('Query Parameter Validation', () => {
    it('should pass validation when custom function returns true', (done) => {
      const validationFunc = async (param: string) => param === 'valid';
      const validator = new CustomParameterValidator('status', validationFunc, EParamType.query, true);
      const req = {
        query: { status: 'valid' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation when custom function returns false', (done) => {
      const validationFunc = async (param: string) => param === 'valid';
      const validator = new CustomParameterValidator('status', validationFunc, EParamType.query, true);
      const req = {
        query: { status: 'invalid' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        expect((err as ApiError).message).to.include('invalid');
        done();
      };

      validator.validate(req, res, next);
    });

    it('should validate with async function', (done) => {
      const validationFunc = async (param: string) => {
        return new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(param.length > 3), 10);
        });
      };
      const validator = new CustomParameterValidator('name', validationFunc, EParamType.query, true);
      const req = {
        query: { name: 'John' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation with async function', (done) => {
      const validationFunc = async (param: string) => {
        return new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(param.length > 10), 10);
        });
      };
      const validator = new CustomParameterValidator('name', validationFunc, EParamType.query, true);
      const req = {
        query: { name: 'John' },
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
    it('should fail when required parameter is missing', (done) => {
      const validationFunc = async (param: string) => param === 'valid';
      const validator = new CustomParameterValidator('status', validationFunc, EParamType.query, true);
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

    it('should pass when optional parameter is missing', (done) => {
      const validationFunc = async (param: string) => param === 'valid';
      const validator = new CustomParameterValidator('status', validationFunc, EParamType.query, false);
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
      const validationFunc = async (param: string) => parseInt(param) > 0;
      const validator = new CustomParameterValidator('id', validationFunc, EParamType.request, true);
      const req = {
        params: { id: '123' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail for invalid route parameter', (done) => {
      const validationFunc = async (param: string) => parseInt(param) > 100;
      const validator = new CustomParameterValidator('id', validationFunc, EParamType.request, true);
      const req = {
        params: { id: '50' },
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

  describe('Complex Validation Logic', () => {
    it('should validate with complex business logic', (done) => {
      const validationFunc = async (param: string) => {
        const allowedValues = ['active', 'inactive', 'pending'];
        return allowedValues.includes(param.toLowerCase());
      };
      const validator = new CustomParameterValidator('status', validationFunc, EParamType.query, true);
      const req = {
        query: { status: 'active' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should validate with external API check simulation', (done) => {
      const validationFunc = async (param: string) => {
        // Simulate async API call
        await new Promise((resolve) => setTimeout(resolve, 10));
        return param.startsWith('valid-');
      };
      const validator = new CustomParameterValidator('token', validationFunc, EParamType.query, true);
      const req = {
        query: { token: 'valid-token-123' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation with multi-condition check', (done) => {
      const validationFunc = async (param: string) => {
        return param.length >= 5 && param.length <= 20 && /^[a-zA-Z0-9]+$/.test(param);
      };
      const validator = new CustomParameterValidator('username', validationFunc, EParamType.query, true);
      const req = {
        query: { username: 'ab!' },
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
    it('should handle empty string parameter', (done) => {
      const validationFunc = async (param: string) => param.length > 0;
      const validator = new CustomParameterValidator('name', validationFunc, EParamType.query, true);
      const req = {
        query: { name: '' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        done();
      };

      validator.validate(req, res, next);
    });

    it('should handle numeric string validation', (done) => {
      const validationFunc = async (param: string) => !isNaN(parseFloat(param));
      const validator = new CustomParameterValidator('amount', validationFunc, EParamType.query, true);
      const req = {
        query: { amount: '123.45' },
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
