import { Application } from 'express';
import WeatherRoute from './weather';
import EventsRoute from './events';
import CalendarsRoute from './calendars';
import BirthdaysRoute from './birthdays';
import UsersRoute from './users';
import LocationRoute from './location';

/**
 * Register all application routes
 * Centralizes route mounting for better maintainability
 */
export const registerRoutes = (app: Application): void => {
  // API routes
  app.use('/api/weather', WeatherRoute);
  app.use('/api/events', EventsRoute);
  app.use('/api/calendars', CalendarsRoute);
  app.use('/api/birthdays', BirthdaysRoute);
  app.use('/api/users', UsersRoute);
  app.use('/api/location', LocationRoute);
};
