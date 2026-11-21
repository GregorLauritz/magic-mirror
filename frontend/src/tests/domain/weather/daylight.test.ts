import { describe, expect, it } from 'vitest'
import { instant } from '@/domain/shared/time'
import { isDaylight, type SunWindow } from '@/domain/weather/daylight'

const at = (iso: string) => instant(Date.parse(iso))

const today: SunWindow = {
    sunrise: at('2024-01-15T06:50:00Z'),
    sunset: at('2024-01-15T16:45:00Z'),
}
const tomorrow: SunWindow = {
    sunrise: at('2024-01-16T06:51:00Z'),
    sunset: at('2024-01-16T16:46:00Z'),
}

describe('isDaylight', () => {
    it('is day between sunrise and sunset', () => {
        expect(isDaylight(at('2024-01-15T12:00:00Z'), [today])).toBe(true)
    })

    it('is night before sunrise and after sunset', () => {
        expect(isDaylight(at('2024-01-15T03:00:00Z'), [today])).toBe(false)
        expect(isDaylight(at('2024-01-15T20:00:00Z'), [today])).toBe(false)
    })

    it('counts sunrise as day and sunset as night', () => {
        expect(isDaylight(today.sunrise, [today])).toBe(true)
        expect(isDaylight(today.sunset, [today])).toBe(false)
    })

    it('uses the sun window of the day the instant falls on', () => {
        const windows = [today, tomorrow]

        // B3: the legacy code applied today's window to tomorrow's hours
        expect(isDaylight(at('2024-01-16T12:00:00Z'), windows)).toBe(true)
        expect(isDaylight(at('2024-01-16T02:00:00Z'), windows)).toBe(false)
    })

    it('is night when there is no window at all', () => {
        expect(isDaylight(at('2024-01-15T12:00:00Z'), [])).toBe(false)
    })
})
