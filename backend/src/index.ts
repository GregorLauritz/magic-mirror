import { ENABLE_HTTPS, mongoDbData, SERVER_PORT } from 'config';
import { HttpServer } from 'services/server/http_server';
import { HttpsServer } from 'services/server/https_server';
import { MongoDb } from 'services/database/mongodb';
import { registerRoutes } from 'routes';
import { errorHandler, notFoundHandler, requestIdMiddleware, responseTimeMiddleware } from 'middleware';
import { EXPRESS_ERROR_LOGGER } from 'services/loggers';

// Initialize database and server
const mongoDb: MongoDb = new MongoDb(mongoDbData);
const server = ENABLE_HTTPS ? new HttpsServer(mongoDb, SERVER_PORT) : new HttpServer(mongoDb, SERVER_PORT);

// Add request tracking middleware
server.app.use(requestIdMiddleware);
server.app.use(responseTimeMiddleware);

// Register all application routes
registerRoutes(server.app);

// 404 handler - must come after all routes
server.app.use(notFoundHandler);

// Error handling middleware - must be last
server.app.use(EXPRESS_ERROR_LOGGER);
server.app.use(errorHandler);

// Start the server
server.start();

export = server.app;
