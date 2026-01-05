import { Router } from 'express';

/**
 * Factory function for creating Express routers
 * Provides a centralized place to configure router options if needed in the future
 * @returns New Express Router instance
 */
export const getRouter = (): Router => Router();
