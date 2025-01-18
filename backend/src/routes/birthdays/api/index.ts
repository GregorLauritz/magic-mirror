import { CALENDAR_CONFIG } from 'config';
import { NextFunction, Request, Response } from 'express';
import { calendar_v3, google } from 'googleapis';
import { ApiError } from 'models/api/api_error';
import { parseRetrievedBirthdays } from 'routes/birthdays/services';
import { getOAuth2ClientForUser } from 'services/google';

export const allBirthdays = async (req: Request, res: Response, next: NextFunction) => {
  const auth = await getOAuth2ClientForUser(req.headers);
  const calendar = google.calendar({
    version: 'v3',
    auth,
  } as calendar_v3.Options);
  const maxResults = parseInt(((req.query.count as string) ?? CALENDAR_CONFIG.DEFAULT_EVENT_COUNT).toString());
  const timeMin = new Date().toISOString();
  const calId = req.query.cal_id as string;
  return calendar.events
    .list({
      calendarId: calId,
      timeMin,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    })
    .then((events) => parseRetrievedBirthdays(events.data))
    .then((parsedEvents) => res.status(200).json(parsedEvents))
    .catch((err) => next(new ApiError('Error while retrieving calendar events', err, 500)));
};
