import { describe, expect, it } from 'vitest'
import { GRID_COLUMNS } from '@/domain/settings/layout'
import { DEFAULT_LAYOUT, WIDGETS } from '@/features/dashboard/widgetRegistry'

describe('widget registry', () => {
    it('keeps the ids that saved layouts refer to (a compatibility contract)', () => {
        expect(WIDGETS.map((widget) => widget.id)).toEqual([
            'time',
            'birthdays',
            'events',
            'trains',
            'current-weather',
            'hourly-weather',
            'daily-forecast',
        ])
    })

    it('has each id once, and a default place for each', () => {
        const ids = WIDGETS.map((widget) => widget.id)

        expect(new Set(ids).size).toBe(ids.length)
        expect(DEFAULT_LAYOUT.map((placement) => placement.widgetId)).toEqual(
            ids
        )
    })

    it('has the default layout the dashboard always opened with', () => {
        expect(DEFAULT_LAYOUT).toEqual([
            { widgetId: 'time', x: 0, y: 0, w: 2, h: 1 },
            { widgetId: 'birthdays', x: 2, y: 0, w: 2, h: 1 },
            { widgetId: 'events', x: 4, y: 0, w: 4, h: 1 },
            { widgetId: 'trains', x: 8, y: 0, w: 4, h: 1 },
            { widgetId: 'current-weather', x: 0, y: 1, w: 4, h: 1 },
            { widgetId: 'hourly-weather', x: 4, y: 1, w: 4, h: 1 },
            { widgetId: 'daily-forecast', x: 8, y: 1, w: 4, h: 1 },
        ])
    })

    it('fits every default widget into the grid', () => {
        for (const { x, w } of DEFAULT_LAYOUT) {
            expect(x + w).toBeLessThanOrEqual(GRID_COLUMNS)
        }
    })
})
