import { describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import { ClockWidget } from '@/features/time'
import { renderWithDeps } from '../../support/renderWithDeps'

describe('ClockWidget', () => {
    it('shows the weekday, date, time and UTC offset of the display zone', () => {
        renderWithDeps(<ClockWidget />, {
            testContainer: {
                now: '2024-01-15T15:26:10Z',
                timeZone: 'Asia/Tokyo',
            },
        })

        expect(screen.getByText('Tuesday')).toBeInTheDocument()
        expect(screen.getByText('16.01.2024')).toBeInTheDocument()
        expect(screen.getByText('00:26')).toBeInTheDocument()
        expect(screen.getByText('Timezone UTC+9')).toBeInTheDocument()
    })

    it('advances when the minute changes', () => {
        const { test } = renderWithDeps(<ClockWidget />, {
            testContainer: { now: '2024-01-15T12:00:30Z', timeZone: 'UTC' },
        })
        expect(screen.getByText('12:00')).toBeInTheDocument()

        act(() => test!.scheduler.advance(30_000))

        expect(screen.getByText('12:01')).toBeInTheDocument()
    })

    it('formats the weekday in the configured locale', () => {
        renderWithDeps(<ClockWidget />, {
            testContainer: {
                now: '2024-01-16T12:00:00Z',
                timeZone: 'UTC',
                config: { locale: 'de-DE' },
            },
        })

        expect(screen.getByText('Dienstag')).toBeInTheDocument()
    })
})
