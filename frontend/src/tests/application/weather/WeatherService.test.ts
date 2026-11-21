import { describe, expect, it, vi } from 'vitest'
import { createWeatherService } from '@/application/weather/WeatherService'
import type { WeatherProvider } from '@/application/ports/WeatherProvider'
import { instant, plainDate } from '@/domain/shared/time'
import type { DailyEntry } from '@/domain/weather/types'
import { makeCondition } from '@/domain/weather/WeatherCondition'
import { FakeClock } from '../../support/FakeClock'

const STUTTGART = { latitude: 48.7758, longitude: 9.1829 }
const measure = { value: 1, unit: 'x' }

const dailyEntry = (date: string): DailyEntry => ({
    date: plainDate(date),
    tempMin: measure,
    tempMax: measure,
    precipitationSum: measure,
    maxWindSpeed: measure,
    condition: makeCondition(0, true),
})

const providerWith = (
    overrides: Partial<WeatherProvider> = {}
): WeatherProvider => ({
    getCurrent: vi.fn(),
    getHourly: vi.fn().mockResolvedValue([]),
    getDaily: vi.fn().mockResolvedValue([]),
    ...overrides,
})

describe('WeatherService', () => {
    it('asks the provider for the display zone of the clock', async () => {
        const provider = providerWith()
        const clock = new FakeClock('2024-01-15T12:00:00Z', 'Europe/Berlin')
        const service = createWeatherService({ provider, clock })
        const controller = new AbortController()

        await service.getHourly(STUTTGART, controller.signal)
        await service.getCurrent(STUTTGART)

        expect(provider.getHourly).toHaveBeenCalledWith(
            STUTTGART,
            'Europe/Berlin',
            controller.signal
        )
        expect(provider.getCurrent).toHaveBeenCalledWith(
            STUTTGART,
            'Europe/Berlin',
            undefined
        )
    })

    describe('getDaily', () => {
        it('requests one extra day for today and returns only the days after it', async () => {
            const provider = providerWith({
                getDaily: vi
                    .fn()
                    .mockResolvedValue(
                        ['15', '16', '17', '18', '19'].map((d) =>
                            dailyEntry(`2024-01-${d}`)
                        )
                    ),
            })
            const clock = new FakeClock('2024-01-15T12:00:00Z', 'UTC')
            const service = createWeatherService({ provider, clock })

            const days = await service.getDaily(STUTTGART, 4)

            expect(provider.getDaily).toHaveBeenCalledWith(
                STUTTGART,
                'UTC',
                5,
                undefined
            )
            expect(days.map((d) => d.date)).toEqual([
                '2024-01-16',
                '2024-01-17',
                '2024-01-18',
                '2024-01-19',
            ])
        })

        it("uses today's date in the display zone, not the UTC date (B3)", async () => {
            // 16:00Z on the 15th is already the 16th in Tokyo
            const provider = providerWith({
                getDaily: vi
                    .fn()
                    .mockResolvedValue(
                        ['16', '17', '18', '19', '20'].map((d) =>
                            dailyEntry(`2024-01-${d}`)
                        )
                    ),
            })
            const clock = new FakeClock(
                instant(Date.parse('2024-01-15T16:00:00Z')),
                'Asia/Tokyo'
            )
            const service = createWeatherService({ provider, clock })

            const days = await service.getDaily(STUTTGART, 4)

            expect(days.map((d) => d.date)).toEqual([
                '2024-01-17',
                '2024-01-18',
                '2024-01-19',
                '2024-01-20',
            ])
        })
    })
})
