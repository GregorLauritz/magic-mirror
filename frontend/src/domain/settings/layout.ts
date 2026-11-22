import type { WidgetPlacement } from './UserSettings'

/** The dashboard grid is twelve columns wide. */
export const GRID_COLUMNS = 12

const isUsable = (placement: WidgetPlacement): boolean =>
    Number.isInteger(placement.x) &&
    Number.isInteger(placement.y) &&
    Number.isInteger(placement.w) &&
    Number.isInteger(placement.h) &&
    placement.x >= 0 &&
    placement.y >= 0 &&
    placement.w >= 1 &&
    placement.h >= 1 &&
    placement.x + placement.w <= GRID_COLUMNS

/**
 * The layout to show: what the user saved, made consistent with the widgets
 * that exist today. Placements of widgets that are gone, repeated or
 * nonsensical are dropped, and widgets without a place (new since the layout
 * was saved) go below everything else at their usual size. Nothing saved, or
 * nothing usable, means the default layout.
 */
export const reconcileLayout = (
    saved: readonly WidgetPlacement[] | undefined,
    defaults: readonly WidgetPlacement[]
): WidgetPlacement[] => {
    const known = new Set(defaults.map((placement) => placement.widgetId))
    const seen = new Set<string>()
    const kept: WidgetPlacement[] = []
    for (const placement of saved ?? []) {
        if (
            known.has(placement.widgetId) &&
            !seen.has(placement.widgetId) &&
            isUsable(placement)
        ) {
            seen.add(placement.widgetId)
            kept.push({ ...placement })
        }
    }
    if (kept.length === 0)
        return defaults.map((placement) => ({ ...placement }))

    let bottom = Math.max(...kept.map((placement) => placement.y + placement.h))
    for (const fallback of defaults) {
        if (seen.has(fallback.widgetId)) continue
        kept.push({ ...fallback, y: bottom })
        bottom += fallback.h
    }
    return kept
}

/** Whether two layouts place every widget alike, whatever their order. */
export const placementsEqual = (
    a: readonly WidgetPlacement[],
    b: readonly WidgetPlacement[]
): boolean => {
    if (a.length !== b.length) return false
    const byId = new Map(b.map((placement) => [placement.widgetId, placement]))
    return a.every((placement) => {
        const other = byId.get(placement.widgetId)
        return (
            other !== undefined &&
            other.x === placement.x &&
            other.y === placement.y &&
            other.w === placement.w &&
            other.h === placement.h
        )
    })
}
