import { calendar_v3, google } from 'googleapis';
import { ApiError } from 'models/api/api_error';
import { getOAuth2ClientForUser } from 'services/google';
import { LOGGER } from 'services/loggers';
import { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { getRouter } from 'services/router_factory';

const getCalendar = (auth: OAuth2Client): calendar_v3.Calendar => {
  return google.calendar({
    version: 'v3',
    auth,
  } as calendar_v3.Options);
};

const listCalendars = async (req: Request, res: Response, next: NextFunction) => {
  const calendar = await getOAuth2ClientForUser(req.headers).then(getCalendar);
  calendar.calendarList
    .list({ maxResults: 100 })
    .then((calendars) => {
      const calendarList = calendars.data.items?.map((calendar) => ({
        name: calendar.summary,
        id: calendar.id,
        primary: calendar.primary ?? false,
      }));
      res.status(200).json(calendarList);
    })
    .catch((err) => {
      LOGGER.error(err);
      next(new ApiError('Error while retrieving calendar list', err, 500));
    });
};

const router = getRouter();

router.get('/', listCalendars);

export default router;
