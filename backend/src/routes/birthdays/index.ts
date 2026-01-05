import { CALENDAR_CONFIG } from 'config';
import { NextFunction, Request, Response } from 'express';
import { calendar_v3 } from 'googleapis';
import { ApiError } from 'models/api/api_error';
import { Birthday, BirthdayList } from 'models/api/birthdays';
import { getGoogleCalendar } from 'services/google';
import { getRouter } from 'services/router_factory';
import { EParamType } from 'services/validators/parameter_validator';
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';
import { RegexParameterValidator } from 'services/validators/regex_parameter_validator';

// Constants and Middleware
const CAL_ID_REGEX = /^.+$/;
const eventCountValidator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, false);
const calendarIdValidator = new RegexParameterValidator('cal_id', CAL_ID_REGEX, EParamType.query, true);

// Birthday Parsing Service
class BirthdayParser {
  static parseBirthdays(events: calendar_v3.Schema$Events): BirthdayList {
    const items = events.items || [];
    const birthdays = items.map(this.parseBirthday);
    return { count: birthdays.length, list: birthdays };
  }

  static parseBirthday(birthday: calendar_v3.Schema$Event): Birthday {
    const name = birthday.summary ?? '';
    return {
      name: name.replace("'s Birthday", ''),
      date: birthday.start?.date ?? new Date().toISOString(),
    };
  }
}

// Calendar Event Retrieval Service
class CalendarEventRetriever {
  static async getBirthdays(req: Request, calendarId: string, maxResults: number): Promise<calendar_v3.Schema$Events> {
    const calendar = getGoogleCalendar(req);
    const timeMin = new Date().toISOString();

    const events = await calendar.events.list({
      calendarId,
      timeMin,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return events.data;
  }
}

// Route Handler
async function allBirthdays(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const maxResults = parseInt((req.query.count as string) || String(CALENDAR_CONFIG.DEFAULT_EVENT_COUNT));
    const calId = req.query.cal_id as string;

    const events = await CalendarEventRetriever.getBirthdays(req, calId, maxResults);
    const parsedEvents = BirthdayParser.parseBirthdays(events);

    res.status(200).json(parsedEvents);
  } catch (err) {
    next(new ApiError('Error retrieving birthdays', err as Error, 500));
  }
}

// Router setup
const router = getRouter();

router.get('/', [eventCountValidator.validate, calendarIdValidator.validate], allBirthdays);

export default router;
