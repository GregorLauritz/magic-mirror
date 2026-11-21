/** How many days the events widget covers (today, tomorrow, the day after). */
export const UPCOMING_EVENT_DAYS = 3
/** How many birthdays the widget shows. */
export const BIRTHDAY_LIMIT = 5
/** The calendar used when none is chosen, as the settings form pre-fills it. */
export const PRIMARY_CALENDAR = 'primary'
/** The user's calendar list rarely changes; no need to refetch it per visit. */
export const CALENDAR_LIST_STALE_MS = 5 * 60_000
