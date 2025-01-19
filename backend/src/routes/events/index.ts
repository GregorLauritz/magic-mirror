import { CALENDAR_CONFIG } from 'config';
import { NextFunction, Request, Response } from 'express';
import { calendar_v3 } from 'googleapis';
import { ApiError } from 'models/api/api_error';
import { CalendarEvent, CalendarEventList } from 'models/api/calendar'; // Import CalendarEvent type
import { getTimeDiff, isDate, isIso8601DatetimeString, TimeUnit } from 'services/dateParser';
import { getGoogleCalendar } from 'services/google';
import { getRouter } from 'services/router_factory';
import { CustomParameterValidator } from 'services/validators/custom_parameter_validator';
import { EParamType } from 'services/validators/parameter_validator';
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';

// Validators
const eventCountValidator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, false);
const minTimeValidator = new CustomParameterValidator('minTime', isIso8601DatetimeString, EParamType.query, false);
const maxTimeValidator = new CustomParameterValidator('maxTime', isIso8601DatetimeString, EParamType.query, false);
const dateValidator = new CustomParameterValidator('date', isDate, EParamType.request, false);

// Calendar Event Service
class CalendarEventService {
  static async getEvents(
    req: Request,
    timeMin: string,
    timeMax: string | undefined,
    maxResults: number,
    calendarId: string,
  ): Promise<calendar_v3.Schema$Events> {
    const calendar = await getGoogleCalendar(req);
    const events = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return events.data;
  }

  static async parseEvents(events: calendar_v3.Schema$Events): Promise<CalendarEventList> {
    const items = events.items || [];
    const parsedEvents = await Promise.all(items.map(this.parseEvent)); // Use this.parseEvent
    return { count: parsedEvents.length, list: parsedEvents };
  }

  static async parseEvent(event: calendar_v3.Schema$Event): Promise<CalendarEvent> {
    // Explicitly type the return value
    const start = new Date(event.start!.dateTime ?? event.start!.date ?? '');
    const end = new Date(event.end!.dateTime ?? event.end!.date ?? '');
    const timeDiff = await getTimeDiff(start, end, TimeUnit.hours);
    return {
      summary: event.summary ?? '',
      description: event.description ?? '',
      location: event.location ?? '',
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: timeDiff % 24 === 0,
      multiDays: timeDiff > 24,
    };
  }
}

// Route Handlers
async function allCalendarEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const maxResults = parseInt((req.query.count as string) || String(CALENDAR_CONFIG.DEFAULT_EVENT_COUNT));
    const timeMin = (req.query.minTime as string) || new Date().toISOString();
    const timeMax = req.query.maxTime as string;
    const calId = (req.query.cal_id as string) || 'primary';

    const events = await CalendarEventService.getEvents(req, timeMin, timeMax, maxResults, calId);
    const parsedEvents = await CalendarEventService.parseEvents(events);

    res.status(200).json(parsedEvents);
  } catch (err) {
    next(new ApiError('Error retrieving calendar events', err as Error, 500));
  }
}

async function eventsAtDate(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.params.date;
    const timeMin = new Date(date).toISOString();
    const timeMax = new Date(date);
    timeMax.setDate(timeMax.getDate() + 1);
    const calId = (req.query.cal_id as string) || 'primary';

    const events = await CalendarEventService.getEvents(req, timeMin, timeMax.toISOString(), 100, calId); // Default to a reasonable maxResults
    const parsedEvents = await CalendarEventService.parseEvents(events);

    res.status(200).json(parsedEvents);
  } catch (err) {
    next(new ApiError('Error retrieving calendar events', err as Error, 500));
  }
}

const router = getRouter();

router.get(
  '/',
  [eventCountValidator.validate, minTimeValidator.validate, maxTimeValidator.validate],
  allCalendarEvents,
);
router.get('/:date', [eventCountValidator.validate, dateValidator.validate], eventsAtDate);

export default router;
