import { Request } from 'express';

/**
 * Checks if a query parameter exists in the request
 * @param req - Express request object
 * @param paramName - Name of the parameter to check
 * @returns True if parameter exists in query string
 */
export const requestQueryContainsParam = (req: Request, paramName: string): boolean => {
  return paramName in req.query;
};

/**
 * Checks if a route parameter exists in the request
 * @param req - Express request object
 * @param paramName - Name of the parameter to check
 * @returns True if parameter exists in route params
 */
export const requestContainsParam = (req: Request, paramName: string): boolean => {
  return paramName in req.params;
};
