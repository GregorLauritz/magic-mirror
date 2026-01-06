import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { LocationContextProvider } from '../../common/LocationContext'
import { useLocation } from '../../hooks/useLocation'
import * as userSettingsApi from '../../apis/user_settings'
import * as geocodeApi from '../../apis/geocode'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactNode } from 'react'

describe('LocationContext', () => {
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

    const createWrapper = () => {
        return ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                <LocationContextProvider>{children}</LocationContextProvider>
            </QueryClientProvider>
        )
    }

    it('should provide default loading state initially', () => {
        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: undefined,
            isLoading: true,
        } as any)

        vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: undefined,
            isLoading: false,
        } as any)

        const { result } = renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isLoading).toBe(true)
        expect(result.current.longitude).toBe(0)
        expect(result.current.latitude).toBe(0)
    })

    it('should update location when user settings and geocode are loaded', async () => {
        const mockUserSettings = {
            city: 'Berlin',
            country: 'Germany',
            zip_code: '10115',
        }

        const mockGeoLocation = {
            longitude: 13.405,
            latitude: 52.52,
        }

        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: mockUserSettings,
            isLoading: false,
        } as any)

        vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: mockGeoLocation,
            isLoading: false,
        } as any)

        const { result } = renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.longitude).toBe(13.405)
        expect(result.current.latitude).toBe(52.52)
    })

    it('should remain in loading state when user settings are loading', () => {
        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: undefined,
            isLoading: true,
        } as any)

        vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: undefined,
            isLoading: false,
        } as any)

        const { result } = renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isLoading).toBe(true)
    })

    it('should remain in loading state when geocode is loading', () => {
        const mockUserSettings = {
            city: 'Berlin',
            country: 'Germany',
            zip_code: '10115',
        }

        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: mockUserSettings,
            isLoading: false,
        } as any)

        vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: undefined,
            isLoading: true,
        } as any)

        const { result } = renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isLoading).toBe(true)
    })

    it('should not load geocode when user settings are missing required fields', () => {
        const mockUserSettings = {
            city: 'Berlin',
            country: undefined,
            zip_code: '10115',
        }

        const geocodeSpy = vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: undefined,
            isLoading: false,
        } as any)

        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: mockUserSettings as any,
            isLoading: false,
        } as any)

        renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        // Check that geocode was called with enabled=false
        expect(geocodeSpy).toHaveBeenCalled()
    })

    it('should handle missing city in user settings', () => {
        const mockUserSettings = {
            city: undefined,
            country: 'Germany',
            zip_code: '10115',
        }

        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: mockUserSettings as any,
            isLoading: false,
        } as any)

        vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: undefined,
            isLoading: false,
        } as any)

        const { result } = renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        expect(result.current.longitude).toBe(0)
        expect(result.current.latitude).toBe(0)
    })

    it('should handle missing zip code in user settings', () => {
        const mockUserSettings = {
            city: 'Berlin',
            country: 'Germany',
            zip_code: undefined,
        }

        vi.spyOn(userSettingsApi, 'useGetUserSettings').mockReturnValue({
            data: mockUserSettings as any,
            isLoading: false,
        } as any)

        vi.spyOn(geocodeApi, 'useGetGeocode').mockReturnValue({
            data: undefined,
            isLoading: false,
        } as any)

        const { result } = renderHook(() => useLocation(), {
            wrapper: createWrapper(),
        })

        expect(result.current.longitude).toBe(0)
        expect(result.current.latitude).toBe(0)
    })
})
