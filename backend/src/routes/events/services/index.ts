import { calendar_v3 } from 'googleapis';
import { EventItem, EventList } from 'models/api/calendar';
import { getTimeDiff, TimeUnit } from 'services/dateParser';

export const parseRetrievedEvents = async (events: calendar_v3.Schema$Events): Promise<EventList> => {
  return {
    count: events.items?.length ?? 0,
    list: await parseEvents(events.items ?? []),
  };
};

const parseEvents = async (gcalEventList: calendar_v3.Schema$Event[]): Promise<Array<EventItem>> => {
  const allEvents: Array<Promise<EventItem>> = [];
  gcalEventList.forEach((e) => allEvents.push(parseEvent(e)));
  return Promise.all(allEvents);
};

export const parseNextEvent = async (events: calendar_v3.Schema$Events): Promise<EventItem> => {
  return parseEvent(events.items![0]);
};

const parseEvent = async (gcalEvent: calendar_v3.Schema$Event): Promise<EventItem> => {
  const start = new Date(gcalEvent.start!.dateTime ?? gcalEvent.start!.date ?? '');
  const end = new Date(gcalEvent.end!.dateTime ?? gcalEvent.end!.date ?? '');
  const timeDiff = await getTimeDiff(start, end, TimeUnit.hours);
  return {
    summary: gcalEvent.summary ?? '',
    description: gcalEvent.description ?? '',
    location: gcalEvent.location ?? '',
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: timeDiff % 24 === 0,
    multiDays: timeDiff > 24,
  };
};
