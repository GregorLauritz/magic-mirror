// Byte-exact shapes of `magic-mirror.user-settings` as earlier versions wrote
// it. They are the compatibility contract of the persistence layer: a user who
// upgrades (or rolls back) must keep their data.

export const FULL_RAW = {
    country: 'DE',
    city: 'Stuttgart',
    zip_code: '70176',
    birthday_cal_id: 'birthdays@group.v.calendar.google.com',
    events_cal_id: 'primary',
    widget_layout: [
        { i: 'time', x: 0, y: 0, w: 2, h: 1 },
        { i: 'events', x: 4, y: 0, w: 4, h: 1 },
    ],
    train_connections: [
        {
            id: 'c1',
            departure_station_id: '8000096',
            departure_station_name: 'Stuttgart Hbf',
            arrival_station_id: '8000105',
            arrival_station_name: 'Frankfurt Hbf',
        },
    ],
    train_display_settings: { mode: 'multiple', carousel_interval: 20 },
}

/** What the domain model must look like for FULL_RAW. */
export const FULL_DOMAIN = {
    address: { country: 'DE', city: 'Stuttgart', postalCode: '70176' },
    birthdayCalendarId: 'birthdays@group.v.calendar.google.com',
    eventsCalendarId: 'primary',
    layout: [
        { widgetId: 'time', x: 0, y: 0, w: 2, h: 1 },
        { widgetId: 'events', x: 4, y: 0, w: 4, h: 1 },
    ],
    trainRoutes: [
        {
            id: 'c1',
            from: { id: '8000096', name: 'Stuttgart Hbf' },
            to: { id: '8000105', name: 'Frankfurt Hbf' },
        },
    ],
    trainDisplay: { mode: 'multiple', carouselIntervalSeconds: 20 },
}

// The dashboard used to write only the layout into a blob that had no address
// yet, so partial blobs exist in the wild.
export const LAYOUT_ONLY_RAW = {
    widget_layout: [{ i: 'time', x: 0, y: 0, w: 2, h: 1 }],
}

export const NO_DISPLAY_SETTINGS_RAW = {
    country: 'DE',
    city: 'Berlin',
    zip_code: '',
    birthday_cal_id: 'primary',
    events_cal_id: 'primary',
    train_connections: FULL_RAW.train_connections,
}

export const WRONG_TYPES_RAW = {
    country: 42,
    city: null,
    zip_code: ['x'],
    birthday_cal_id: {},
    events_cal_id: 7,
    widget_layout: {},
    train_connections: 'nope',
    train_display_settings: 'carousel',
}
