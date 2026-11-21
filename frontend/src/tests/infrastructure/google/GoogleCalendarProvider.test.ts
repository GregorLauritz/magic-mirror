import { beforeEach, describe, expect, it } from 'vitest'
import { GoogleCalendarProvider } from '@/infrastructure/google/GoogleCalendarProvider'
import { instant } from '@/domain/shared/time'
import { FakeHttpClient } from '../../support/FakeHttpClient'

const BASE = 'https://calendar.test/v3'
const at = (iso: string) => instant(Date.parse(iso))
const paramsOf = (http: FakeHttpClient) =>
    new URL(http.requests[0].url).searchParams

describe('GoogleCalendarProvider', () => {
    let http: FakeHttpClient
    let provider: GoogleCalendarProvider

    beforeEach(() => {
        http = new FakeHttpClient().when('calendar.test').reply({ items: [] })
        provider = new GoogleCalendarProvider(http, BASE)
    })

    describe('getEvents', () => {
        it('asks for single, start-ordered events within the range', async () => {
            await provider.getEvents({
                calendarId: 'primary',
                from: at('2024-01-15T09:00:00Z'),
                to: at('2024-01-18T00:00:00Z'),
                limit: 100,
            })

            const url = new URL(http.requests[0].url)
            expect(`${url.origin}${url.pathname}`).toBe(
                `${BASE}/calendars/primary/events`
            )
            expect(Object.fromEntries(url.searchParams)).toEqual({
                timeMin: '2024-01-15T09:00:00.000Z',
                timeMax: '2024-01-18T00:00:00.000Z',
                maxResults: '100',
                singleEvents: 'true',
                orderBy: 'startTime',
            })
        })

        it('leaves out timeMax for an open-ended query', async () => {
            await provider.getEvents({
                calendarId: 'primary',
                from: at('2024-01-15T09:00:00Z'),
                limit: 5,
            })

            expect(paramsOf(http).has('timeMax')).toBe(false)
        })

        it('encodes calendar ids that contain special characters', async () => {
            await provider.getEvents({
                calendarId: 'family#contacts@group.v.calendar.google.com',
                from: at('2024-01-15T09:00:00Z'),
                limit: 5,
            })

            expect(http.requests[0].url).toContain(
                '/calendars/family%23contacts%40group.v.calendar.google.com/events'
            )
        })

        it('maps the answer and forwards the abort signal', async () => {
            http = new FakeHttpClient().when('calendar.test').reply({
                items: [
                    {
                        summary: 'A',
                        start: { date: '2024-01-15' },
                        end: { date: '2024-01-16' },
                    },
                ],
            })
            provider = new GoogleCalendarProvider(http, BASE)
            const controller = new AbortController()

            const events = await provider.getEvents(
                {
                    calendarId: 'primary',
                    from: at('2024-01-15T09:00:00Z'),
                    limit: 5,
                },
                controller.signal
            )

            expect(events).toHaveLength(1)
            expect(http.requests[0].signal).toBe(controller.signal)
        })
    })

    describe('getBirthdays', () => {
        it('asks for the upcoming single events of the birthday calendar', async () => {
            await provider.getBirthdays({
                calendarId: 'bday@group',
                from: at('2024-01-15T09:00:00Z'),
                limit: 5,
            })

            expect(Object.fromEntries(paramsOf(http))).toEqual({
                timeMin: '2024-01-15T09:00:00.000Z',
                maxResults: '5',
                singleEvents: 'true',
                orderBy: 'startTime',
            })
        })
    })

    describe('listCalendars', () => {
        it('asks for up to 100 calendars of the signed-in user', async () => {
            http = new FakeHttpClient().when('calendarList').reply({
                items: [{ summary: 'Work', id: 'w', primary: true }],
            })
            provider = new GoogleCalendarProvider(http, BASE)

            const calendars = await provider.listCalendars()

            expect(http.requests[0].url).toBe(
                `${BASE}/users/me/calendarList?maxResults=100`
            )
            expect(calendars).toEqual([
                { name: 'Work', id: 'w', primary: true },
            ])
        })
    })
})
