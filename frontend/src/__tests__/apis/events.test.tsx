import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetEvents, useGetDateEvents } from '../../apis/events'
import * as fetchUtils from '../../common/fetch'
import { ReactNode } from 'react'

describe('events API hooks', () => {
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

    describe('useGetEvents', () => {
        it('should fetch events successfully', async () => {
            const mockEvents = {
                events: [
                    {
                        id: '1',
                        summary: 'Test Event',
                        start: '2024-01-15T12:00:00Z',
                        end: '2024-01-15T13:00:00Z',
                    },
                ],
            }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockEvents)

            const params = new URLSearchParams({
                cal_id: 'cal_123',
                start: '2024-01-15',
                end: '2024-01-20',
            })

            const { result } = renderHook(() => useGetEvents(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockEvents)
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                expect.stringContaining('/api/events?')
            )
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                expect.stringContaining('cal_id=cal_123')
            )
        })

        it('should handle different query parameters', async () => {
            const mockEvents = { events: [] }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockEvents)

            const params1 = new URLSearchParams({ cal_id: 'cal_123' })
            const params2 = new URLSearchParams({ cal_id: 'cal_456' })

            const { result: result1 } = renderHook(
                () => useGetEvents(params1),
                {
                    wrapper,
                }
            )
            const { result: result2 } = renderHook(
                () => useGetEvents(params2),
                {
                    wrapper,
                }
            )

            await waitFor(() => {
                expect(result1.current.isSuccess).toBe(true)
                expect(result2.current.isSuccess).toBe(true)
            })

            expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(2)
        })

        it('should handle fetch errors', async () => {
            const mockError = new Error('Events API error')
            vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

            const params = new URLSearchParams({ cal_id: 'cal_123' })

            const { result } = renderHook(() => useGetEvents(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toEqual(mockError)
        })

        it('should be in loading state initially', () => {
            vi.spyOn(fetchUtils, 'fetchJson').mockImplementation(
                () => new Promise(() => {})
            )

            const params = new URLSearchParams({ cal_id: 'cal_123' })

            const { result } = renderHook(() => useGetEvents(params), {
                wrapper,
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.data).toBeUndefined()
        })
    })

    describe('useGetDateEvents', () => {
        it('should fetch date-specific events successfully', async () => {
            const mockEvents = {
                events: [
                    {
                        id: '1',
                        summary: 'Daily Event',
                        start: '2024-01-15T09:00:00Z',
                        end: '2024-01-15T10:00:00Z',
                    },
                ],
            }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockEvents)

            const { result } = renderHook(
                () => useGetDateEvents('cal_123', '2024-01-15'),
                { wrapper }
            )

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockEvents)
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                '/api/events/2024-01-15?cal_id=cal_123'
            )
        })

        it('should handle different dates and calendar IDs', async () => {
            const mockEvents = { events: [] }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockEvents)

            const { result: result1 } = renderHook(
                () => useGetDateEvents('cal_123', '2024-01-15'),
                { wrapper }
            )
            const { result: result2 } = renderHook(
                () => useGetDateEvents('cal_456', '2024-01-16'),
                { wrapper }
            )

            await waitFor(() => {
                expect(result1.current.isSuccess).toBe(true)
                expect(result2.current.isSuccess).toBe(true)
            })

            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                '/api/events/2024-01-15?cal_id=cal_123'
            )
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                '/api/events/2024-01-16?cal_id=cal_456'
            )
        })

        it('should handle fetch errors', async () => {
            const mockError = new Error('Date events API error')
            vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

            const { result } = renderHook(
                () => useGetDateEvents('cal_123', '2024-01-15'),
                { wrapper }
            )

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toEqual(mockError)
        })

        it('should have unique query keys for different dates', async () => {
            const mockEvents = { events: [] }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockEvents)

            const { result: result1 } = renderHook(
                () => useGetDateEvents('cal_123', '2024-01-15'),
                { wrapper }
            )
            const { result: result2 } = renderHook(
                () => useGetDateEvents('cal_123', '2024-01-16'),
                { wrapper }
            )

            await waitFor(() => {
                expect(result1.current.isSuccess).toBe(true)
                expect(result2.current.isSuccess).toBe(true)
            })

            expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(2)
        })
    })
})
