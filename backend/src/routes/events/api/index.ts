import { CALENDAR_CONFIG } from 'config';
import { NextFunction, Request, Response } from 'express';
import { parseRetrievedEvents } from 'routes/events/services';
import { ApiError } from 'models/api/api_error';
import { LOGGER } from 'services/loggers';
import { calendar_v3, google } from 'googleapis';
import { getOAuth2ClientForUser } from 'services/google';
import { OAuth2Client } from 'google-auth-library';

const getCalendar = (auth: OAuth2Client): calendar_v3.Calendar => {
  return google.calendar({
    version: 'v3',
    auth,
  } as calendar_v3.Options);
};

export const allCalendarEvents = async (req: Request, res: Response, next: NextFunction) => {
  const calendar = await getOAuth2ClientForUser(req.headers).then(getCalendar);
  const params = await getQueryParams(req);
  calendar.events
    .list(params)
    .then((events) => parseRetrievedEvents(events.data))
    .then((parsedEvents) => res.status(200).json(parsedEvents))
    .catch((err) => {
      LOGGER.error(err);
      next(new ApiError('Error while retrieving calendar events', err, 500));
    });
};

export const eventsAtDate = async (req: Request, res: Response, next: NextFunction) => {
  const calendar = await getOAuth2ClientForUser(req.headers).then(getCalendar);
  const params = await getQueryParams(req);
  calendar.events
    .list(params)
    .then((events) => {
      return events;
    })
    .then((events) => {
      res.status(200).json(parseRetrievedEvents(events.data));
    })
    .catch((err) => next(new ApiError('Error while retrieving calendar events', err, 500)));
};

const getQueryParams = async (req: Request): Promise<calendar_v3.Params$Resource$Events$List> => {
  const maxResults = await parseCountQueryParameter(req);
  const timeMin = await parseMinTimeParam(req);
  const timeMax = await parseMaxTimeQueryParam(req);
  const calId = (req.query.cal_id ?? 'primary') as string;

  return {
    calendarId: calId,
    timeMin,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  };
};

const parseCountQueryParameter = async (req: Request): Promise<number> => {
  return parseInt((req.query.count as string) ?? CALENDAR_CONFIG.DEFAULT_EVENT_COUNT);
};

const parseMinTimeParam = async (req: Request): Promise<string> => {
  if (req.query.minTime) return (req.query.minTime as string).toString();
  return new Date().toISOString();
};

const parseMaxTimeQueryParam = async (req: Request): Promise<string | undefined> => {
  if (req.query.maxTime) return (req.query.maxTime as string).toString();
};
