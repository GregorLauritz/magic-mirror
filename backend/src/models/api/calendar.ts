export type EventRequestParams = {
  maxResults: number;
  minTime: string;
  maxTime?: string;
};

export type CalendarEventList = {
  count: number;
  list: Array<CalendarEvent>;
};

export type CalendarEvent = {
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  multiDays: boolean;
};
