import { useSyncExternalStore } from 'react'
import { useServices } from '@/app/services/useServices'
import type { UserSettings } from '@/domain/settings/UserSettings'
import { useStoreSnapshot } from '@/shared/hooks/useStoreSnapshot'

/** All settings. Prefer `useSetting` so a component re-renders only for what it uses. */
export const useSettings = (): UserSettings =>
    useStoreSnapshot(useServices().settings)

/**
 * One piece of the settings. `pick` must return a primitive or a reference that
 * stays the same until that piece really changes (e.g. `(s) => s.address`).
 */
export const useSetting = <R>(pick: (settings: UserSettings) => R): R => {
    const { settings } = useServices()
    return useSyncExternalStore(settings.subscribe, () =>
        pick(settings.getSnapshot())
    )
}

/** Merges into the settings; a key set to undefined clears that field. */
export const usePatchSettings = () => useServices().settings.patch

export const useSaveSettings = () => useServices().saveSettings

export const useResetLocalData = () => useServices().resetLocalData
