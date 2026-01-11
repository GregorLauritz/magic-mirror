import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetUserSettings } from '../../apis/user_settings'
import * as fetchUtils from '../../common/fetch'
import { ReactNode } from 'react'

describe('useGetUserSettings', () => {
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

    it('should fetch user settings successfully', async () => {
        const mockUserSettings = {
            country: 'Germany',
            city: 'Berlin',
            zip_code: '10115',
            birthday_cal_id: 'cal_123',
            events_cal_id: 'cal_456',
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockUserSettings)

        const { result } = renderHook(() => useGetUserSettings(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockUserSettings)
        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            '/api/users/settings/me',
            undefined,
            [200]
        )
    })

    it('should allow 404 status when allowNotFound is true', async () => {
        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue({})

        const { result } = renderHook(() => useGetUserSettings(true), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
            '/api/users/settings/me',
            undefined,
            [200, 404]
        )
    })

    it('should handle fetch errors', async () => {
        const mockError = new Error('Network error')
        vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetUserSettings(), { wrapper })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toEqual(mockError)
    })

    it('should not refetch on interval', async () => {
        const mockUserSettings = {
            country: 'Germany',
            city: 'Berlin',
            zip_code: '10115',
            birthday_cal_id: 'cal_123',
            events_cal_id: 'cal_456',
        }

        const fetchSpy = vi
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue(mockUserSettings)

        const { result } = renderHook(() => useGetUserSettings(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(fetchSpy).toHaveBeenCalledTimes(1)

        // Wait a bit to ensure no refetch happens
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should have different query keys for different allowNotFound values', async () => {
        const mockUserSettings = {
            country: 'Germany',
            city: 'Berlin',
            zip_code: '10115',
            birthday_cal_id: 'cal_123',
            events_cal_id: 'cal_456',
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockUserSettings)

        const { result: result1 } = renderHook(
            () => useGetUserSettings(false),
            {
                wrapper,
            }
        )
        const { result: result2 } = renderHook(() => useGetUserSettings(true), {
            wrapper,
        })

        await waitFor(() => {
            expect(result1.current.isSuccess).toBe(true)
            expect(result2.current.isSuccess).toBe(true)
        })

        // Both should have fetched independently due to different query keys
        expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(2)
    })

    it('should be in loading state initially', () => {
        vi.spyOn(fetchUtils, 'fetchJson').mockImplementation(
            () => new Promise(() => {}) // Never resolves
        )

        const { result } = renderHook(() => useGetUserSettings(), { wrapper })

        expect(result.current.isLoading).toBe(true)
        expect(result.current.data).toBeUndefined()
    })
})
