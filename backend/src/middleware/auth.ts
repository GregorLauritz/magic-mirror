import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';

/**
 * Authentication middleware
 * Validates that required authentication headers are present
 * This app uses OAuth proxy headers (x-forwarded-user, x-forwarded-email, x-forwarded-access-token)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.headers['x-forwarded-user'];
  const userEmail = req.headers['x-forwarded-email'];
  const accessToken = req.headers['x-forwarded-access-token'];

  if (!userId || !userEmail || !accessToken) {
    next(
      new ApiError(
        'Authentication required. Missing required headers: x-forwarded-user, x-forwarded-email, or x-forwarded-access-token',
        undefined,
        401,
      ),
    );
    return;
  }

  next();
};

/**
 * Optional authentication middleware
 * Allows requests with or without authentication
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Just pass through - authentication headers are optional
  next();
};
