import { ENABLE_HTTPS, mongoDbData, SERVER_PORT } from 'config';
import { HttpServer } from 'services/server/http_server';
import { HttpsServer } from 'services/server/https_server';
import { default as WeatherRoute } from 'routes/weather';
import { default as EventsRoute } from 'routes/events';
import { default as CalendarsRoute } from 'routes/calendars';
import { default as BirthdaysRoute } from 'routes/birthdays';
import { default as UsersRoute } from 'routes/users';
import { default as LocationRoute } from 'routes/location';
import { Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { EXPRESS_ERROR_LOGGER } from 'services/loggers';
import { MongoDb } from 'services/database/mongodb';

const mongoDb: MongoDb = new MongoDb(mongoDbData);
const server = ENABLE_HTTPS ? new HttpsServer(mongoDb, SERVER_PORT) : new HttpServer(mongoDb, SERVER_PORT);

server.app.use('/api/weather', WeatherRoute);
server.app.use('/api/events', EventsRoute);
server.app.use('/api/calendars', CalendarsRoute);
server.app.use('/api/birthdays', BirthdaysRoute);

server.app.use('/api/users', UsersRoute);
server.app.use('/api/location', LocationRoute);

// ERROR HANDLING
server.app.use(EXPRESS_ERROR_LOGGER);

const isApiError = (err: Error): err is ApiError => {
  return (err as ApiError).status !== undefined && (err as ApiError).message !== undefined;
};

server.app.use((err: ApiError | Error, _req: Request, res: Response) => {
  if (isApiError(err)) {
    return res.status(err.status).json({ error: err.message }).end();
  }
  return res.status(500).json({ error: 'Oops... something unexpected happened!' }).end();
});

server.start();

export = server.app;
