import { describe, expect, it } from 'vitest'
import { instant } from '@/domain/shared/time'
import { formatClock, formatUtcOffset } from '@/features/time/format'

const at = (iso: string) => instant(Date.parse(iso))

describe('formatUtcOffset', () => {
    // Parity with the legacy "Timezone UTC<offset>" label.
    it.each([
        [540, '+9'],
        [330, '+5.5'],
        [345, '+5.75'],
        [60, '+1'],
        [0, '0'],
        [-60, '-1'],
        [-210, '-3.5'],
        [-480, '-8'],
    ])('%i minutes is %s', (minutes, expected) => {
        expect(formatUtcOffset(minutes)).toBe(expected)
    })
})

describe('formatClock', () => {
    it('formats the weekday, date, time and offset in the display zone', () => {
        // 15:26 UTC on Monday is already 00:26 on Tuesday in Tokyo
        expect(
            formatClock(at('2024-01-15T15:26:00Z'), 'Asia/Tokyo', 'en-US')
        ).toEqual({
            weekday: 'Tuesday',
            date: '16.01.2024',
            hour: '00',
            minute: '26',
            utcOffset: '+9',
        })
    })

    it('zero-pads day, month, hour and minute', () => {
        const display = formatClock(at('2024-03-05T04:07:00Z'), 'UTC', 'en-US')

        expect(display.date).toBe('05.03.2024')
        expect(display.hour).toBe('04')
        expect(display.minute).toBe('07')
    })

    it('follows daylight saving time in the offset label', () => {
        const winter = formatClock(
            at('2024-01-15T12:00:00Z'),
            'Europe/Berlin',
            'en-US'
        )
        const summer = formatClock(
            at('2024-07-15T12:00:00Z'),
            'Europe/Berlin',
            'en-US'
        )

        expect([winter.utcOffset, summer.utcOffset]).toEqual(['+1', '+2'])
    })

    it('names the weekday in the configured locale', () => {
        expect(
            formatClock(at('2024-01-16T12:00:00Z'), 'UTC', 'de-DE').weekday
        ).toBe('Dienstag')
    })
})
