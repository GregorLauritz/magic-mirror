import type { Layout } from 'react-grid-layout'
import type { WidgetPlacement } from '@/domain/settings/UserSettings'

// The grid library speaks `{ i, x, y, w, h }`; the rest of the app speaks
// placements. This is the only place that knows both.

export const toGridItems = (placements: readonly WidgetPlacement[]): Layout =>
    placements.map(({ widgetId, x, y, w, h }) => ({ i: widgetId, x, y, w, h }))

export const fromGridItems = (items: Layout): WidgetPlacement[] =>
    items.map(({ i, x, y, w, h }) => ({ widgetId: i, x, y, w, h }))
