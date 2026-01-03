import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { LOGGER } from 'services/loggers';

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export const errorHandler = (err: ApiError | Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    // Handle known API errors
    LOGGER.warn('API Error', {
      message: err.message,
      status: err.status,
      path: req.path,
      method: req.method,
    });
    res.status(err.status).json({ error: err.message });
  } else {
    // Handle unexpected errors
    LOGGER.error('Unhandled Server Error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
    });
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

/**
 * 404 Not Found handler
 * Should be registered after all routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
};
