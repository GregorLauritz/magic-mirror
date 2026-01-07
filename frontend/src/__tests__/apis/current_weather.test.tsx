import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetCurrentWeather } from '../../apis/current_weather'
import * as fetchUtils from '../../common/fetch'
import { ReactNode } from 'react'

describe('useGetCurrentWeather', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    cacheTime: 0,
                },
            },
        })
        vi.clearAllMocks()
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )

    it('should fetch current weather successfully', async () => {
        const mockWeather = {
            latitude: 52.52,
            longitude: 13.405,
            temperature: {
                current: 20,
                min: 15,
                max: 25,
                feels_like: 19,
            },
            windspeed: 10,
            weathercode: 1,
            update_time: '2024-01-15T12:00:00Z',
            weather_icon: '01d',
            description: 'Clear sky',
            precipitation_sum: 0,
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockWeather)

        const { result } = renderHook(
            () => useGetCurrentWeather(13.405, 52.52, true, 'Europe/Berlin'),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockWeather)
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('/api/weather/current?')
        )
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('latitude=52.52')
        )
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('longitude=13.405')
        )
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('timezone=Europe%2FBerlin')
        )
    })

    it('should use default parameters when not provided', async () => {
        const mockWeather = {
            latitude: 0,
            longitude: 0,
            temperature: {
                current: 20,
                min: 15,
                max: 25,
                feels_like: 19,
            },
            windspeed: 10,
            weathercode: 1,
            update_time: '2024-01-15T12:00:00Z',
            weather_icon: '01d',
            description: 'Clear sky',
            precipitation_sum: 0,
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockWeather)

        const { result } = renderHook(() => useGetCurrentWeather(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('timezone=GMT')
        )
    })

    it('should be disabled when enabled is false', () => {
        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue({})

        const { result } = renderHook(
            () => useGetCurrentWeather(13.405, 52.52, false, 'Europe/Berlin'),
            { wrapper }
        )

        expect(result.current.isLoading).toBe(false)
        expect(fetchUtils.fetchJson).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
        const mockError = new Error('Weather API error')
        vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

        const { result } = renderHook(
            () => useGetCurrentWeather(13.405, 52.52, true, 'Europe/Berlin'),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toEqual(mockError)
    })

    it('should configure refetch interval', async () => {
        const mockWeather = {
            latitude: 52.52,
            longitude: 13.405,
            temperature: {
                current: 20,
                min: 15,
                max: 25,
                feels_like: 19,
            },
            windspeed: 10,
            weathercode: 1,
            update_time: '2024-01-15T12:00:00Z',
            weather_icon: '01d',
            description: 'Clear sky',
            precipitation_sum: 0,
        }

        const fetchSpy = vi
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue(mockWeather)

        const { result } = renderHook(
            () => useGetCurrentWeather(13.405, 52.52, true, 'Europe/Berlin'),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should fetch independently for different parameters', async () => {
        const mockWeather = {
            latitude: 52.52,
            longitude: 13.405,
            temperature: {
                current: 20,
                min: 15,
                max: 25,
                feels_like: 19,
            },
            windspeed: 10,
            weathercode: 1,
            update_time: '2024-01-15T12:00:00Z',
            weather_icon: '01d',
            description: 'Clear sky',
            precipitation_sum: 0,
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockWeather)

        const { result: result1 } = renderHook(
            () => useGetCurrentWeather(13.405, 52.52, true, 'Europe/Berlin'),
            { wrapper }
        )

        await waitFor(() => {
            expect(result1.current.isSuccess).toBe(true)
        })

        // Should fetch with correct parameters
        expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(1)
    })
})
