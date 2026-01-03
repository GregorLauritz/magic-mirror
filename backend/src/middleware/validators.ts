import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';

/**
 * Simple validation middleware functions
 * Replaces class-based validators with simpler functional approach
 */

export type ValidationRule = (value: string) => boolean;

/**
 * Validates a query parameter exists and optionally matches validation rules
 */
export const validateQueryParam =
  (paramName: string, required = true, rules?: ValidationRule[], errorMessage?: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const value = req.query[paramName] as string;

    // Check if parameter exists
    if (!value || value.trim() === '') {
      if (required) {
        next(new ApiError(`Query parameter '${paramName}' is required`, undefined, 400));
        return;
      }
      next();
      return;
    }

    // Apply validation rules if provided
    if (rules) {
      const isValid = rules.every((rule) => rule(value));
      if (!isValid) {
        next(new ApiError(errorMessage || `Query parameter '${paramName}' is invalid`, undefined, 400));
        return;
      }
    }

    next();
  };

/**
 * Validates a route parameter exists and optionally matches validation rules
 */
export const validateRouteParam =
  (paramName: string, rules?: ValidationRule[], errorMessage?: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    // Route params are always required
    if (!value || value.trim() === '') {
      next(new ApiError(`Route parameter '${paramName}' is required`, undefined, 400));
      return;
    }

    // Apply validation rules if provided
    if (rules) {
      const isValid = rules.every((rule) => rule(value));
      if (!isValid) {
        next(new ApiError(errorMessage || `Route parameter '${paramName}' is invalid`, undefined, 400));
        return;
      }
    }

    next();
  };

/**
 * Common validation rules
 */
export const ValidationRules = {
  /**
   * Validates value is within numeric range
   */
  range: (min: number, max: number): ValidationRule => {
    return (value: string) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= min && num <= max;
    };
  },

  /**
   * Validates value matches regex pattern
   */
  regex: (pattern: RegExp): ValidationRule => {
    return (value: string) => pattern.test(value);
  },

  /**
   * Validates value is a positive integer
   */
  positiveInteger: (): ValidationRule => {
    return (value: string) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0 && Number.isInteger(num);
    };
  },

  /**
   * Validates value is a non-negative integer
   */
  nonNegativeInteger: (): ValidationRule => {
    return (value: string) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    };
  },

  /**
   * Validates value is a valid ISO date string
   */
  isoDate: (): ValidationRule => {
    return (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    };
  },

  /**
   * Validates value length
   */
  length: (min: number, max: number): ValidationRule => {
    return (value: string) => value.length >= min && value.length <= max;
  },

  /**
   * Validates value is in allowed list
   */
  oneOf: (allowedValues: string[]): ValidationRule => {
    return (value: string) => allowedValues.includes(value);
  },
};
