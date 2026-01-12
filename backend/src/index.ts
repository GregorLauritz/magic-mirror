import { ENABLE_HTTPS, mongoDbData, SERVER_PORT } from 'config';
import { HttpServer } from 'services/server/http_server';
import { HttpsServer } from 'services/server/https_server';
import { default as WeatherRoute } from 'routes/weather';
import { default as EventsRoute } from 'routes/events';
import { default as CalendarsRoute } from 'routes/calendars';
import { default as BirthdaysRoute } from 'routes/birthdays';
import { default as TasksRoute } from 'routes/tasks';
import { default as UsersRoute } from 'routes/users';
import { default as LocationRoute } from 'routes/location';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { EXPRESS_ERROR_LOGGER, LOGGER } from 'services/loggers';
import { MongoDb } from 'services/database/mongodb';

const mongoDb: MongoDb = new MongoDb(mongoDbData);
const server = ENABLE_HTTPS ? new HttpsServer(mongoDb, SERVER_PORT) : new HttpServer(mongoDb, SERVER_PORT);

server.app.use('/api/weather', WeatherRoute);
server.app.use('/api/events', EventsRoute);
server.app.use('/api/calendars', CalendarsRoute);
server.app.use('/api/birthdays', BirthdaysRoute);
server.app.use('/api/tasks', TasksRoute);

server.app.use('/api/users', UsersRoute);
server.app.use('/api/location', LocationRoute);

// ERROR HANDLING MIDDLEWARE
server.app.use(EXPRESS_ERROR_LOGGER);

/**
 * Global error handler for all routes
 * Catches ApiError instances and generic errors, logging and formatting appropriately
 */
server.app.use((err: ApiError | Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    // Known API errors with specific status codes
    LOGGER.warn('API Error', {
      message: err.message,
      status: err.status,
      path: req.path,
      method: req.method,
    });
    res.status(err.status).json({
      error: err.message,
      status: err.status,
    });
  } else {
    // Unexpected errors - log full details
    LOGGER.error('Unhandled Server Error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      headers: req.headers,
    });
    res.status(500).json({
      error: 'An unexpected error occurred',
      status: 500,
    });
  }
});

server.start();

export default server.app;
