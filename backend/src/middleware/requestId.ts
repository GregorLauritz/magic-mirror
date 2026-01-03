import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID tracking middleware
 * Adds a unique ID to each request for tracing and logging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request already has an ID from a proxy/load balancer
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach to request object for use in handlers
  req.headers['x-request-id'] = requestId;

  // Add to response headers for client tracking
  res.setHeader('X-Request-ID', requestId);

  next();
};
