import { describe, expect, it } from 'vitest'
import { fromGridItems, toGridItems } from '@/features/dashboard/gridAdapter'

describe('gridAdapter', () => {
    it('maps placements to the grid library items and back', () => {
        const placements = [
            { widgetId: 'time', x: 0, y: 0, w: 2, h: 1 },
            { widgetId: 'events', x: 4, y: 1, w: 4, h: 2 },
        ]

        const items = toGridItems(placements)

        expect(items).toEqual([
            { i: 'time', x: 0, y: 0, w: 2, h: 1 },
            { i: 'events', x: 4, y: 1, w: 4, h: 2 },
        ])
        expect(fromGridItems(items)).toEqual(placements)
    })

    it('keeps only what a placement holds (the library adds its own fields)', () => {
        const placements = fromGridItems([
            {
                i: 'time',
                x: 0,
                y: 0,
                w: 2,
                h: 1,
                static: false,
                moved: true,
                minW: 1,
            },
        ])

        expect(placements).toEqual([
            { widgetId: 'time', x: 0, y: 0, w: 2, h: 1 },
        ])
    })
})
