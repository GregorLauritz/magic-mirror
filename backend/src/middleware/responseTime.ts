import { NextFunction, Request, Response } from 'express';
import { LOGGER } from 'services/loggers';

/**
 * Response time tracking middleware
 * Measures and logs request processing time
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Listen for response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const requestId = req.headers['x-request-id'];

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      LOGGER.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        requestId,
        statusCode: res.statusCode,
      });
    }

    // Add response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
  });

  next();
};
