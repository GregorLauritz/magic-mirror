import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetEvents } from '../../apis/events'
import * as googleAuth from '../../services/googleAuth'
import * as googleCalendar from '../../services/googleCalendar'
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
        vi.spyOn(googleAuth, 'isSignedIn').mockReturnValue(true)
        vi.spyOn(googleAuth, 'getAccessToken').mockResolvedValue('fake-token')
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )

    const mockEvents = {
        count: 1,
        list: [
            {
                summary: 'Test Event',
                description: '',
                location: '',
                start: '2024-01-15T12:00:00.000Z',
                end: '2024-01-15T13:00:00.000Z',
                allDay: false,
                multiDays: false,
            },
        ],
    }

    describe('useGetEvents', () => {
        it('should fetch events successfully', async () => {
            const getEventsSpy = vi
                .spyOn(googleCalendar, 'getEvents')
                .mockResolvedValue(mockEvents)

            const params = new URLSearchParams({
                cal_id: 'cal_123',
                minTime: '2024-01-15T00:00:00.000Z',
            })

            const { result } = renderHook(() => useGetEvents(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockEvents)
            expect(getEventsSpy).toHaveBeenCalledWith(
                'fake-token',
                'cal_123',
                '2024-01-15T00:00:00.000Z',
                undefined,
                100
            )
        })

        it('should not fetch when not signed in with Google', () => {
            vi.spyOn(googleAuth, 'isSignedIn').mockReturnValue(false)
            const getEventsSpy = vi.spyOn(googleCalendar, 'getEvents')

            const params = new URLSearchParams({ cal_id: 'cal_123' })
            const { result } = renderHook(() => useGetEvents(params), {
                wrapper,
            })

            expect(result.current.isLoading).toBe(false)
            expect(getEventsSpy).not.toHaveBeenCalled()
        })

        it('should handle different query parameters', async () => {
            vi.spyOn(googleCalendar, 'getEvents').mockResolvedValue({
                count: 0,
                list: [],
            })

            const params1 = new URLSearchParams({ cal_id: 'cal_123' })
            const params2 = new URLSearchParams({ cal_id: 'cal_456' })

            const { result: result1 } = renderHook(
                () => useGetEvents(params1),
                { wrapper }
            )
            const { result: result2 } = renderHook(
                () => useGetEvents(params2),
                { wrapper }
            )

            await waitFor(() => {
                expect(result1.current.isSuccess).toBe(true)
                expect(result2.current.isSuccess).toBe(true)
            })

            expect(googleCalendar.getEvents).toHaveBeenCalledTimes(2)
        })

        it('should handle fetch errors', async () => {
            const mockError = new Error('Events API error')
            vi.spyOn(googleCalendar, 'getEvents').mockRejectedValue(mockError)

            const params = new URLSearchParams({ cal_id: 'cal_123' })

            const { result } = renderHook(() => useGetEvents(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toEqual(mockError)
        })
    })
})
