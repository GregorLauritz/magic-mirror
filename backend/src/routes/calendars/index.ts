import { NextFunction, Request, Response } from 'express';
import { calendar_v3 } from 'googleapis';
import { ApiError } from 'models/api/api_error';
import { apiCache } from 'services/cache';
import { getGoogleCalendar } from 'services/google';
import { getUserId } from 'services/headers';
import { getRouter } from 'services/router_factory';

// Calendar List Retrieval Service
class CalendarListRetriever {
  static async getCalendarList(req: Request): Promise<calendar_v3.Schema$CalendarListEntry[] | undefined> {
    const userId = getUserId(req.headers);
    const cacheKey = `${userId}:calendars`;

    const cached = apiCache.get<calendar_v3.Schema$CalendarListEntry[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const calendar = getGoogleCalendar(req);
    const calendars = await calendar.calendarList.list({ maxResults: 100 });
    const result = calendars.data.items;

    if (result !== undefined) {
      apiCache.set(cacheKey, result);
    }

    return result;
  }
}

// Calendar List Parsing Service
class CalendarListParser {
  static parseCalendarList(items: calendar_v3.Schema$CalendarListEntry[] | undefined) {
    return items?.map((calendar) => ({
      name: calendar.summary,
      id: calendar.id,
      primary: calendar.primary ?? false,
    }));
  }
}

// Route Handler
async function listCalendars(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const calendarList = await CalendarListRetriever.getCalendarList(req);
    const parsedList = CalendarListParser.parseCalendarList(calendarList);

    res.status(200).json(parsedList);
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError('Error retrieving calendar list', err as Error, 500));
    }
  }
}

const router = getRouter();
router.get('/', listCalendars);

export default router;
