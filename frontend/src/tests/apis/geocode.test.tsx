import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetGeocode } from '../../apis/geocode'
import * as fetchUtils from '../../common/fetch'
import { ReactNode } from 'react'

describe('useGetGeocode', () => {
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

    it('should fetch geocode successfully', async () => {
        const mockLocation = {
            longitude: 13.405,
            latitude: 52.52,
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockLocation)

        const params = [
            { name: 'city', value: 'Berlin' },
            { name: 'country', value: 'Germany' },
            { name: 'zip_code', value: '10115' },
        ]

        const { result } = renderHook(() => useGetGeocode(params, true), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockLocation)
    })

    it('should be disabled when enabled is false', () => {
        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue({})

        const params = [{ name: 'city', value: 'Berlin' }]

        const { result } = renderHook(() => useGetGeocode(params, false), {
            wrapper,
        })

        expect(result.current.isLoading).toBe(false)
        expect(fetchUtils.fetchJson).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
        const mockError = new Error('Geocode API error')
        vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

        const params = [{ name: 'city', value: 'Berlin' }]

        const { result } = renderHook(() => useGetGeocode(params, true), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toEqual(mockError)
    })

    it('should use default parameters and be enabled by default', async () => {
        const mockLocation = {
            longitude: 0,
            latitude: 0,
        }
        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockLocation)

        const { result } = renderHook(() => useGetGeocode(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })
    })

    it('should handle empty query parameters', async () => {
        const mockLocation = {
            longitude: 0,
            latitude: 0,
        }

        vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockLocation)

        const { result } = renderHook(() => useGetGeocode([], true), {
            wrapper,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockLocation)
    })
})
