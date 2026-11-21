import { describe, expect, it } from 'vitest'
import { createCalendarService } from '@/application/calendar/CalendarService'
import { instant } from '@/domain/shared/time'
import { FakeCalendarProvider } from '../../support/FakeCalendarProvider'
import { FakeClock } from '../../support/FakeClock'
import { timedEvent } from '../../support/calendarFixtures'

const at = (iso: string) => instant(Date.parse(iso))

describe('CalendarService', () => {
    describe('getUpcomingEvents', () => {
        it('asks once for the whole range: from now to the end of the last day, in the display zone (Q5)', async () => {
            const provider = new FakeCalendarProvider({ events: [] })
            const clock = new FakeClock('2024-01-15T12:00:00Z', 'Asia/Tokyo') // 21:00 on the 15th in Tokyo
            const service = createCalendarService({ provider, clock })

            await service.getUpcomingEvents({ calendarId: 'cal', days: 3 })

            // three local days from the 15th: the range ends at midnight after the 17th, Tokyo time
            expect(provider.eventCalls).toEqual([
                {
                    calendarId: 'cal',
                    from: at('2024-01-15T12:00:00Z'),
                    to: at('2024-01-17T15:00:00Z'),
                    limit: 100,
                },
            ])
        })

        it('returns the events as the provider delivered them', async () => {
            const events = [
                timedEvent('A', '2024-01-15T13:00:00Z', '2024-01-15T14:00:00Z'),
            ]
            const service = createCalendarService({
                provider: new FakeCalendarProvider({ events }),
                clock: new FakeClock(),
            })

            await expect(
                service.getUpcomingEvents({ calendarId: 'cal', days: 3 })
            ).resolves.toBe(events)
        })

        it('forwards the abort signal', async () => {
            const provider = new FakeCalendarProvider({ events: [] })
            const controller = new AbortController()

            await createCalendarService({
                provider,
                clock: new FakeClock(),
            }).getUpcomingEvents(
                { calendarId: 'cal', days: 1 },
                controller.signal
            )

            expect(provider.signals).toEqual([controller.signal])
        })
    })

    it('asks for the next birthdays from now', async () => {
        const provider = new FakeCalendarProvider({ birthdays: [] })
        const service = createCalendarService({
            provider,
            clock: new FakeClock('2024-01-15T12:00:00Z'),
        })

        await service.getBirthdays({ calendarId: 'bday', limit: 5 })

        expect(provider.birthdayCalls).toEqual([
            { calendarId: 'bday', from: at('2024-01-15T12:00:00Z'), limit: 5 },
        ])
    })

    it('lists the calendars', async () => {
        const calendars = [{ name: 'Work', id: 'w', primary: true }]
        const provider = new FakeCalendarProvider({ calendars })

        const result = await createCalendarService({
            provider,
            clock: new FakeClock(),
        }).listCalendars()

        expect(result).toBe(calendars)
    })
})
