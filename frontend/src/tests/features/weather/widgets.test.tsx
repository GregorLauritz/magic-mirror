import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { CurrentWeatherBody } from '@/features/weather/CurrentWeatherWidget'
import { DailyForecastBody } from '@/features/weather/DailyForecastWidget'
import { HourlyForecastBody } from '@/features/weather/HourlyForecastWidget'
import { FakeWeatherProvider } from '../../support/FakeWeatherProvider'
import {
    createTestContainer,
    type TestContainerOptions,
} from '../../support/createTestContainer'
import { renderWithDeps } from '../../support/renderWithDeps'
import {
    currentWeather,
    dailyEntries,
    hourlyEntries,
} from '../../support/weatherFixtures'

const COORDS = { latitude: 48.7758, longitude: 9.1829 }

const render = (
    ui: React.ReactElement,
    provider: FakeWeatherProvider,
    options: TestContainerOptions = {}
) => {
    const test = createTestContainer({ weatherProvider: provider, ...options })
    return renderWithDeps(ui, { deps: test.deps })
}

describe('HourlyForecastBody', () => {
    it('shows the hours in the display zone (B3: 12:00Z is 21:00 in Tokyo)', async () => {
        // 11:20Z = 20:20 JST; upcoming entries start at 12:00Z = 21:00 JST
        render(
            <HourlyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                hourly: hourlyEntries('2024-01-15T09:00:00Z', 12),
            }),
            { now: '2024-01-15T11:20:00Z', timeZone: 'Asia/Tokyo' }
        )

        for (const label of ['21:00', '22:00', '23:00', '00:00', '01:00']) {
            expect(await screen.findByText(label)).toBeInTheDocument()
        }
        expect(screen.queryByText('20:00')).not.toBeInTheDocument()
    })

    it('shows the same hours in another zone for the same instants', async () => {
        render(
            <HourlyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                hourly: hourlyEntries('2024-01-15T09:00:00Z', 12),
            }),
            { now: '2024-01-15T11:20:00Z', timeZone: 'America/Los_Angeles' }
        )

        expect(await screen.findByText('04:00')).toBeInTheDocument()
        expect(screen.getByText('08:00')).toBeInTheDocument()
    })

    it('shows rounded temperature, precipitation and wind for each hour', async () => {
        render(
            <HourlyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                hourly: hourlyEntries('2024-01-15T09:00:00Z', 12),
            }),
            { now: '2024-01-15T11:20:00Z', timeZone: 'UTC' }
        )

        expect(await screen.findByText('3°C')).toBeInTheDocument()
        expect(screen.getByText('103 km/h')).toBeInTheDocument()
        expect(screen.getAllByText('0 mm')).toHaveLength(5)
    })

    it('labels each icon with the description of its condition', async () => {
        render(
            <HourlyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                hourly: hourlyEntries('2024-01-15T09:00:00Z', 12),
            }),
            { now: '2024-01-15T11:20:00Z', timeZone: 'UTC' }
        )

        const icons = await screen.findAllByAltText('Mainly clear')
        expect(icons).toHaveLength(5)
        expect(icons[0]).toHaveAttribute(
            'src',
            'https://openweathermap.org/img/wn/02d@4x.png'
        )
    })

    it('shows placeholders while loading', () => {
        const { container } = render(
            <HourlyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                hourly: hourlyEntries('2024-01-15T09:00:00Z', 12),
            })
        )

        expect(
            container.querySelectorAll('.MuiSkeleton-root').length
        ).toBeGreaterThan(0)
    })

    it('shows an error message when the forecast cannot be loaded', async () => {
        render(
            <HourlyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({ hourly: new Error('boom') })
        )

        expect(
            await screen.findByText('Error loading forecast')
        ).toBeInTheDocument()
    })
})

describe('CurrentWeatherBody', () => {
    it('shows temperature, range, feels-like, precipitation and wind', async () => {
        render(
            <CurrentWeatherBody coordinates={COORDS} />,
            new FakeWeatherProvider({ current: currentWeather() })
        )

        expect(await screen.findByText('7°C')).toBeInTheDocument() // 6.5 rounded
        expect(screen.getByText('9°C')).toBeInTheDocument()
        expect(screen.getByText('1°C')).toBeInTheDocument()
        expect(screen.getByText('Feels like 2°C')).toBeInTheDocument()
        expect(screen.getByText('Precipitation: 0.4 mm')).toBeInTheDocument()
        expect(screen.getByText('Windspeed: 11.2 km/h')).toBeInTheDocument()
    })

    it('shows an icon labelled with the corrected description (B12)', async () => {
        render(
            <CurrentWeatherBody coordinates={COORDS} />,
            new FakeWeatherProvider({ current: currentWeather() })
        )

        const icon = await screen.findByAltText('Overcast')
        expect(icon).toHaveAttribute(
            'src',
            'https://openweathermap.org/img/wn/04d@4x.png'
        )
    })

    it('shows a dash when the precipitation total is unknown', async () => {
        render(
            <CurrentWeatherBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                current: currentWeather({
                    precipitationToday: { value: null, unit: 'mm' },
                }),
            })
        )

        expect(
            await screen.findByText('Precipitation: - mm')
        ).toBeInTheDocument()
    })

    it('falls back to the local icon for a condition without one', async () => {
        render(
            <CurrentWeatherBody coordinates={COORDS} />,
            new FakeWeatherProvider({
                current: currentWeather({
                    condition: { code: 1234, kind: 'unknown', isDay: true },
                }),
            })
        )

        const icon = await screen.findByAltText('Unknown weather')
        expect(icon.getAttribute('src')).not.toContain('openweathermap')
    })

    it('shows an error message when the weather cannot be loaded', async () => {
        render(
            <CurrentWeatherBody coordinates={COORDS} />,
            new FakeWeatherProvider({ current: new Error('boom') })
        )

        expect(
            await screen.findByText('Error loading weather')
        ).toBeInTheDocument()
    })
})

describe('DailyForecastBody', () => {
    const provider = () =>
        new FakeWeatherProvider({ daily: dailyEntries('2024-01-15', 5) })

    it('names each day by its calendar date, whatever the process time zone (B3)', async () => {
        render(<DailyForecastBody coordinates={COORDS} />, provider(), {
            now: '2024-01-15T12:00:00Z',
            timeZone: 'UTC',
        })

        // 2024-01-16 is a Tuesday. The legacy code parsed the date as UTC
        // midnight and formatted it in the browser zone, so west of UTC it
        // showed the previous weekday.
        for (const day of ['Tue', 'Wed', 'Thu', 'Fri']) {
            expect(await screen.findByText(day)).toBeInTheDocument()
        }
        expect(screen.queryByText('Mon')).not.toBeInTheDocument()
    })

    it('shows max and min temperature, precipitation and wind per day', async () => {
        render(<DailyForecastBody coordinates={COORDS} />, provider(), {
            now: '2024-01-15T12:00:00Z',
            timeZone: 'UTC',
        })

        expect(await screen.findByText('9°C')).toBeInTheDocument() // max of 16th
        expect(screen.getByText('1°C')).toBeInTheDocument() // min of 16th
        expect(screen.getByText('0.5 mm')).toBeInTheDocument()
        expect(screen.getByText('6 km/h')).toBeInTheDocument()
    })

    it('uses the day icon with a description as its label', async () => {
        render(<DailyForecastBody coordinates={COORDS} />, provider(), {
            now: '2024-01-15T12:00:00Z',
            timeZone: 'UTC',
        })

        const icons = await screen.findAllByAltText('Rain')
        expect(icons).toHaveLength(4)
        expect(icons[0]).toHaveAttribute(
            'src',
            'https://openweathermap.org/img/wn/10d@4x.png'
        )
    })

    it('shows an error message when the forecast cannot be loaded', async () => {
        render(
            <DailyForecastBody coordinates={COORDS} />,
            new FakeWeatherProvider({ daily: new Error('boom') })
        )

        expect(
            await screen.findByText('Error loading forecast')
        ).toBeInTheDocument()
    })
})
