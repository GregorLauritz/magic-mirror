import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useGetEvents } from '../../apis/events'
import * as googleCalendar from '../../services/googleCalendar'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { createTestContainer } from '../support/createTestContainer'
import { FakeAuthSession } from '../support/FakeAuthSession'
import { renderHookWithDeps } from '../support/renderWithDeps'

describe('events API hooks', () => {
    let auth: FakeAuthSession
    let deps: AppDependencies

    beforeEach(() => {
        auth = new FakeAuthSession()
        deps = createTestContainer({ authSession: auth }).deps
        vi.clearAllMocks()
    })

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

            const { result } = renderHookWithDeps(() => useGetEvents(params), {
                deps,
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
            auth.setState({ status: 'signed-out' })
            const getEventsSpy = vi.spyOn(googleCalendar, 'getEvents')

            const params = new URLSearchParams({ cal_id: 'cal_123' })
            const { result } = renderHookWithDeps(() => useGetEvents(params), {
                deps,
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

            const { result: result1 } = renderHookWithDeps(
                () => useGetEvents(params1),
                { deps }
            )
            const { result: result2 } = renderHookWithDeps(
                () => useGetEvents(params2),
                { deps }
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

            const { result } = renderHookWithDeps(() => useGetEvents(params), {
                deps,
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toEqual(mockError)
        })
    })
})
