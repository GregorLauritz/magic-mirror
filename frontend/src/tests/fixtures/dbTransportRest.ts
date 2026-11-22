// Hand-authored responses in the shape of db.transport.rest v6 (hafas-client).
// The sandbox cannot reach the real service, so they follow its documentation:
// `departure` / `arrival` are the ACTUAL (real-time) moments and already
// contain the delay; `plannedDeparture` / `plannedArrival` are the timetable;
// `departureDelay` / `arrivalDelay` are in SECONDS and null without real-time
// data. Re-verify against the live API on a networked machine.

export const stationsResponse = [
    {
        type: 'stop',
        id: '8000096',
        name: 'Stuttgart Hbf',
        location: { type: 'location', latitude: 48.784, longitude: 9.18 },
    },
    { type: 'station', id: '8000105', name: 'Frankfurt(Main)Hbf' },
    { type: 'location', id: '123', name: 'Some address' },
    { type: 'stop', id: '8000999' }, // no name
    { type: 'stop', name: 'No id' },
]

/** One direct ICE, five minutes late: departure = planned + departureDelay. */
export const delayedDirectJourney = {
    type: 'journey',
    legs: [
        {
            origin: { type: 'stop', id: '8000096', name: 'Stuttgart Hbf' },
            destination: {
                type: 'stop',
                id: '8000105',
                name: 'Frankfurt(Main)Hbf',
            },
            departure: '2024-01-15T10:05:00+01:00',
            plannedDeparture: '2024-01-15T10:00:00+01:00',
            departureDelay: 300,
            arrival: '2024-01-15T11:52:00+01:00',
            plannedArrival: '2024-01-15T11:47:00+01:00',
            arrivalDelay: 300,
            line: { type: 'line', name: 'ICE 599' },
            direction: 'Hamburg-Altona',
            departurePlatform: '9',
            arrivalPlatform: '7',
        },
    ],
}

/** Walk, then a cancelled regional train, then an ICE. */
export const multiLegJourney = {
    type: 'journey',
    legs: [
        {
            origin: { type: 'location', name: 'Home' },
            destination: { type: 'stop', id: '1', name: 'Stop A' },
            departure: '2024-01-15T09:50:00+01:00',
            plannedDeparture: '2024-01-15T09:50:00+01:00',
            departureDelay: null,
            arrival: '2024-01-15T10:00:00+01:00',
            plannedArrival: '2024-01-15T10:00:00+01:00',
            walking: true,
            distance: 700,
        },
        {
            origin: { type: 'stop', id: '1', name: 'Stop A' },
            destination: { type: 'stop', id: '2', name: 'Stop B' },
            departure: null,
            plannedDeparture: '2024-01-15T10:10:00+01:00',
            departureDelay: null,
            arrival: null,
            plannedArrival: '2024-01-15T10:40:00+01:00',
            line: { name: 'RE 5' },
            departurePlatform: '3',
            cancelled: true,
        },
        {
            origin: { type: 'stop', id: '2', name: 'Stop B' },
            destination: { type: 'stop', id: '3', name: 'Stop C' },
            departure: '2024-01-15T10:50:00+01:00',
            plannedDeparture: '2024-01-15T10:50:00+01:00',
            departureDelay: 0,
            arrival: '2024-01-15T12:20:00+01:00',
            plannedArrival: '2024-01-15T12:20:00+01:00',
            line: { name: 'ICE 71' },
        },
    ],
}

export const journeysResponse = {
    journeys: [delayedDirectJourney, multiLegJourney],
}
