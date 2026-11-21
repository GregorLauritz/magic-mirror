import { useMemo } from 'react'
import type { Address } from '@/domain/location/Address'
// Transitional bridge (removed in step S5): reads the address through the legacy
// settings hook. S5 moves settings into a store and this becomes a selector.
// eslint-disable-next-line import/no-restricted-paths -- transitional bridge to legacy code
import { useGetUserSettings } from '../../../apis/user_settings'

export interface SettingsAddress {
    /** Undefined until a country was saved. */
    readonly address: Address | undefined
    readonly isLoading: boolean
}

export const useSettingsAddress = (): SettingsAddress => {
    const { data, isLoading } = useGetUserSettings()
    return useMemo(
        () => ({
            address: data?.country
                ? {
                      country: data.country,
                      city: data.city ?? '',
                      postalCode: data.zip_code ?? '',
                  }
                : undefined,
            isLoading,
        }),
        [data, isLoading]
    )
}
