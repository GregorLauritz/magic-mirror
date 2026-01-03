import { ApiError } from 'models/api/api_error';

/**
 * Body validation utility
 * Provides simple schema-based validation for request bodies
 */

export type FieldValidator = (value: unknown) => boolean;
export type FieldSchema = {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  validate?: FieldValidator;
  errorMessage?: string;
};

export type BodySchema = Record<string, FieldSchema>;

/**
 * Validates request body against a schema
 * Throws ApiError if validation fails
 */
export const validateBody = <T = Record<string, unknown>>(body: unknown, schema: BodySchema): T => {
  if (!body || typeof body !== 'object') {
    throw new ApiError('Request body is required', undefined, 400);
  }

  const bodyObj = body as Record<string, unknown>;
  const errors: string[] = [];

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = bodyObj[fieldName];

    // Check if required field is missing
    if (fieldSchema.required && (value === undefined || value === null)) {
      errors.push(`Field '${fieldName}' is required`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (!fieldSchema.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== fieldSchema.type) {
      errors.push(`Field '${fieldName}' must be of type ${fieldSchema.type}, got ${actualType}`);
      continue;
    }

    // Custom validation
    if (fieldSchema.validate && !fieldSchema.validate(value)) {
      errors.push(fieldSchema.errorMessage || `Field '${fieldName}' failed custom validation`);
    }
  }

  if (errors.length > 0) {
    throw new ApiError(`Validation failed: ${errors.join(', ')}`, undefined, 400);
  }

  return body as T;
};

/**
 * Common field validators
 */
export const FieldValidators = {
  /**
   * Validates string is not empty
   */
  notEmpty: (): FieldValidator => {
    return (value: unknown) => typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * Validates string matches regex
   */
  regex: (pattern: RegExp): FieldValidator => {
    return (value: unknown) => typeof value === 'string' && pattern.test(value);
  },

  /**
   * Validates number is in range
   */
  range: (min: number, max: number): FieldValidator => {
    return (value: unknown) => typeof value === 'number' && value >= min && value <= max;
  },

  /**
   * Validates value is in allowed list
   */
  oneOf: <T>(allowedValues: T[]): FieldValidator => {
    return (value: unknown) => allowedValues.includes(value as T);
  },

  /**
   * Validates email format
   */
  email: (): FieldValidator => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: unknown) => typeof value === 'string' && emailRegex.test(value);
  },

  /**
   * Validates string length
   */
  length: (min: number, max: number): FieldValidator => {
    return (value: unknown) => typeof value === 'string' && value.length >= min && value.length <= max;
  },

  /**
   * Validates array has minimum length
   */
  minLength: (min: number): FieldValidator => {
    return (value: unknown) => Array.isArray(value) && value.length >= min;
  },

  /**
   * Validates positive number
   */
  positive: (): FieldValidator => {
    return (value: unknown) => typeof value === 'number' && value > 0;
  },
};
