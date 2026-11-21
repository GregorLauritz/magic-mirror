import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useGetBirthdays } from '../../apis/birthday'
import * as googleCalendar from '../../services/googleCalendar'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { createTestContainer } from '../support/createTestContainer'
import { FakeAuthSession } from '../support/FakeAuthSession'
import { renderHookWithDeps } from '../support/renderWithDeps'

describe('useGetBirthdays', () => {
    let auth: FakeAuthSession
    let deps: AppDependencies

    beforeEach(() => {
        auth = new FakeAuthSession()
        deps = createTestContainer({ authSession: auth }).deps
        vi.clearAllMocks()
    })

    const mockBirthdays = {
        count: 2,
        list: [
            { name: 'John Doe', date: '2024-01-20' },
            { name: 'Jane Smith', date: '2024-01-25' },
        ],
    }

    it('should fetch birthdays successfully', async () => {
        const getBirthdaysSpy = vi
            .spyOn(googleCalendar, 'getBirthdays')
            .mockResolvedValue(mockBirthdays)

        const { result } = renderHookWithDeps(
            () => useGetBirthdays('cal_123', 5),
            { deps }
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockBirthdays)
        expect(getBirthdaysSpy).toHaveBeenCalledWith('fake-token', 'cal_123', 5)
    })

    it('should use default birthday count when not provided', async () => {
        const getBirthdaysSpy = vi
            .spyOn(googleCalendar, 'getBirthdays')
            .mockResolvedValue({ count: 0, list: [] })

        const { result } = renderHookWithDeps(
            () => useGetBirthdays('cal_123'),
            { deps }
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(getBirthdaysSpy).toHaveBeenCalledWith(
            'fake-token',
            'cal_123',
            expect.any(Number)
        )
    })

    it('should not fetch when not signed in with Google', () => {
        auth.setState({ status: 'signed-out' })
        const getBirthdaysSpy = vi.spyOn(googleCalendar, 'getBirthdays')

        const { result } = renderHookWithDeps(
            () => useGetBirthdays('cal_123', 5),
            { deps }
        )

        expect(result.current.isLoading).toBe(false)
        expect(getBirthdaysSpy).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
        const mockError = new Error('Birthdays API error')
        vi.spyOn(googleCalendar, 'getBirthdays').mockRejectedValue(mockError)

        const { result } = renderHookWithDeps(
            () => useGetBirthdays('cal_123', 5),
            { deps }
        )

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toEqual(mockError)
    })

    it('should have unique query keys for different parameters', async () => {
        vi.spyOn(googleCalendar, 'getBirthdays').mockResolvedValue({
            count: 0,
            list: [],
        })

        const { result: result1 } = renderHookWithDeps(
            () => useGetBirthdays('cal_123', 5),
            { deps }
        )
        const { result: result2 } = renderHookWithDeps(
            () => useGetBirthdays('cal_456', 10),
            { deps }
        )

        await waitFor(() => {
            expect(result1.current.isSuccess).toBe(true)
            expect(result2.current.isSuccess).toBe(true)
        })

        expect(googleCalendar.getBirthdays).toHaveBeenCalledTimes(2)
    })
})
