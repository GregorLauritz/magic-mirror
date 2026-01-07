import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetBirthdays } from '../../apis/birthday'
import * as fetchUtils from '../../common/fetch'
import { ReactNode } from 'react'

describe('useGetBirthdays', () => {
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

    it('should fetch birthdays successfully', async () => {
        const mockBirthdays = {
            birthdays: [
                {
                    name: 'John Doe',
                    date: '2024-01-20',
                    age: 30,
                },
                {
                    name: 'Jane Smith',
                    date: '2024-01-25',
                    age: 25,
                },
            ],
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockBirthdays)

        const { result } = renderHook(() => useGetBirthdays('cal_123', 5), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockBirthdays)
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('/api/birthdays?')
        )
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('cal_id=cal_123')
        )
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('count=5')
        )
    })

    it('should use default birthday count when not provided', async () => {
        const mockBirthdays = { birthdays: [] }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockBirthdays)

        const { result } = renderHook(() => useGetBirthdays('cal_123'), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('cal_id=cal_123')
        )
        // Should use default count from BIRTHDAY_COUNT constant
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringMatching(/count=\d+/)
        )
    })

    it('should handle different calendar IDs', async () => {
        const mockBirthdays = { birthdays: [] }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockBirthdays)

        const { result: result1 } = renderHook(
            () => useGetBirthdays('cal_123', 3),
            {
                wrapper,
            }
        )
        const { result: result2 } = renderHook(
            () => useGetBirthdays('cal_456', 3),
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

    it('should handle different birthday counts', async () => {
        const mockBirthdays = { birthdays: [] }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockBirthdays)

        const { result: result1 } = renderHook(
            () => useGetBirthdays('cal_123', 3),
            {
                wrapper,
            }
        )
        const { result: result2 } = renderHook(
            () => useGetBirthdays('cal_123', 10),
            {
                wrapper,
            }
        )

        await waitFor(() => {
            expect(result1.current.isSuccess).toBe(true)
            expect(result2.current.isSuccess).toBe(true)
        })

        expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(2)
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('count=3')
        )
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('count=10')
        )
    })

    it('should handle fetch errors', async () => {
        const mockError = new Error('Birthdays API error')
        vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetBirthdays('cal_123', 5), {
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

        const { result } = renderHook(() => useGetBirthdays('cal_123', 5), {
            wrapper,
        })

        expect(result.current.isLoading).toBe(true)
        expect(result.current.data).toBeUndefined()
    })

    it('should have unique query keys for different parameters', async () => {
        const mockBirthdays = { birthdays: [] }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockBirthdays)

        const { result: result1 } = renderHook(
            () => useGetBirthdays('cal_123', 5),
            {
                wrapper,
            }
        )
        const { result: result2 } = renderHook(
            () => useGetBirthdays('cal_456', 10),
            {
                wrapper,
            }
        )

        await waitFor(() => {
            expect(result1.current.isSuccess).toBe(true)
            expect(result2.current.isSuccess).toBe(true)
        })

        // Both should have fetched independently
        expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(2)
    })

    it('should handle empty birthday list', async () => {
        const mockBirthdays = { birthdays: [] }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockBirthdays)

        const { result } = renderHook(() => useGetBirthdays('cal_123', 5), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockBirthdays)
        expect(result.current.data?.list).toHaveLength(0)
    })
})
