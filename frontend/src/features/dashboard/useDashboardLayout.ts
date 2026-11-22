import { useCallback, useMemo } from 'react'
import type { WidgetPlacement } from '@/domain/settings/UserSettings'
import { placementsEqual, reconcileLayout } from '@/domain/settings/layout'
import { usePatchSettings, useSetting } from '@/features/settings'
import { DEFAULT_LAYOUT } from './widgetRegistry'

/** Forgets the saved layout, so the default one applies again. True if done. */
export const useResetLayout = (): (() => boolean) => {
    const patch = usePatchSettings()
    // No saved layout means "the default layout".
    return useCallback(() => patch({ layout: undefined }).ok, [patch])
}

/** The layout to show, and the ways to change it. */
export const useDashboardLayout = () => {
    const saved = useSetting((settings) => settings.layout)
    const patch = usePatchSettings()
    const reset = useResetLayout()

    const layout = useMemo(
        () => reconcileLayout(saved, DEFAULT_LAYOUT),
        [saved]
    )

    // Saved as soon as the user lets go; a drag that ends where it began (or
    // a layout the grid merely re-reports) writes nothing. True if it holds.
    const save = useCallback(
        (next: readonly WidgetPlacement[]): boolean =>
            placementsEqual(next, layout) || patch({ layout: next }).ok,
        [layout, patch]
    )

    return { layout, save, reset }
}
