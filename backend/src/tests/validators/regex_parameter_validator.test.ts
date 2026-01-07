import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Request, Response, NextFunction } from 'express';
import { RegexParameterValidator } from '../../services/validators/regex_parameter_validator';
import { EParamType } from '../../services/validators/parameter_validator';
import { ApiError } from '../../models/api/api_error';

describe('RegexParameterValidator', () => {
  describe('Query Parameter Validation', () => {
    it('should pass validation for matching pattern', (done) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validator = new RegexParameterValidator('email', emailRegex, EParamType.query, true);
      const req = {
        query: { email: 'user@example.com' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail validation for non-matching pattern', (done) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validator = new RegexParameterValidator('email', emailRegex, EParamType.query, true);
      const req = {
        query: { email: 'invalid-email' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.instanceOf(ApiError);
        expect((err as ApiError).status).to.equal(400);
        expect((err as ApiError).message).to.include('Invalid');
        done();
      };

      validator.validate(req, res, next);
    });

    it('should validate country code pattern', (done) => {
      const countryCodeRegex = /^[a-zA-Z]{2}$/;
      const validator = new RegexParameterValidator('country', countryCodeRegex, EParamType.query, true);
      const req = {
        query: { country: 'US' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail for invalid country code', (done) => {
      const countryCodeRegex = /^[a-zA-Z]{2}$/;
      const validator = new RegexParameterValidator('country', countryCodeRegex, EParamType.query, true);
      const req = {
        query: { country: 'USA' },
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
      const validator = new RegexParameterValidator('code', /^\w+$/, EParamType.query, true);
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
      const validator = new RegexParameterValidator('code', /^\w+$/, EParamType.query, false);
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
      const validator = new RegexParameterValidator('icon', /^\d{2}[dn]$/, EParamType.request, true);
      const req = {
        params: { icon: '01d' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail for route parameter not matching pattern', (done) => {
      const validator = new RegexParameterValidator('icon', /^\d{2}[dn]$/, EParamType.request, true);
      const req = {
        params: { icon: '00x' },
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

  describe('Common Pattern Validations', () => {
    it('should validate ZIP code pattern', (done) => {
      const zipRegex = /^\d{5}$/;
      const validator = new RegexParameterValidator('zip', zipRegex, EParamType.query, true);
      const req = {
        query: { zip: '12345' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should validate alphanumeric pattern', (done) => {
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      const validator = new RegexParameterValidator('code', alphanumericRegex, EParamType.query, true);
      const req = {
        query: { code: 'ABC123' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail for special characters when not allowed', (done) => {
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      const validator = new RegexParameterValidator('code', alphanumericRegex, EParamType.query, true);
      const req = {
        query: { code: 'ABC-123!' },
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
    it('should handle empty string when pattern requires content', (done) => {
      const nonEmptyRegex = /^.+$/;
      const validator = new RegexParameterValidator('name', nonEmptyRegex, EParamType.query, true);
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

    it('should validate case-sensitive patterns', (done) => {
      const uppercaseRegex = /^[A-Z]+$/;
      const validator = new RegexParameterValidator('code', uppercaseRegex, EParamType.query, true);
      const req = {
        query: { code: 'ABC' },
      } as unknown as Request;
      const res = {} as Response;
      const next: NextFunction = (err?: unknown) => {
        expect(err).to.be.undefined;
        done();
      };

      validator.validate(req, res, next);
    });

    it('should fail case-sensitive patterns with wrong case', (done) => {
      const uppercaseRegex = /^[A-Z]+$/;
      const validator = new RegexParameterValidator('code', uppercaseRegex, EParamType.query, true);
      const req = {
        query: { code: 'abc' },
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
});
