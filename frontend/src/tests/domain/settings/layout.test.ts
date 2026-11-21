import { describe, expect, it } from 'vitest'
import {
    GRID_COLUMNS,
    placementsEqual,
    reconcileLayout,
} from '@/domain/settings/layout'
import type { WidgetPlacement } from '@/domain/settings/UserSettings'

const p = (
    widgetId: string,
    x: number,
    y: number,
    w = 2,
    h = 1
): WidgetPlacement => ({
    widgetId,
    x,
    y,
    w,
    h,
})

const DEFAULTS = [p('a', 0, 0), p('b', 2, 0), p('c', 4, 0, 4, 1)]

describe('reconcileLayout', () => {
    it.each([undefined, []])(
        'is the default layout when nothing is saved (%j)',
        (saved) => {
            expect(reconcileLayout(saved, DEFAULTS)).toEqual(DEFAULTS)
        }
    )

    it('does not hand out the default array itself (callers may not mutate the defaults)', () => {
        expect(reconcileLayout(undefined, DEFAULTS)).not.toBe(DEFAULTS)
    })

    it('keeps the saved positions of widgets it knows, in the saved order', () => {
        const saved = [p('c', 0, 0, 6, 2), p('a', 6, 0), p('b', 8, 0)]

        expect(reconcileLayout(saved, DEFAULTS)).toEqual(saved)
    })

    it('drops placements of widgets that no longer exist', () => {
        const saved = [
            p('a', 0, 0),
            p('gone', 2, 0),
            p('b', 4, 0),
            p('c', 6, 0),
        ]

        expect(reconcileLayout(saved, DEFAULTS).map((x) => x.widgetId)).toEqual(
            ['a', 'b', 'c']
        )
    })

    it('keeps the first placement of a widget that is saved twice', () => {
        const saved = [p('a', 0, 0), p('a', 9, 9), p('b', 2, 0), p('c', 4, 0)]

        expect(reconcileLayout(saved, DEFAULTS)[0]).toEqual(p('a', 0, 0))
        expect(reconcileLayout(saved, DEFAULTS)).toHaveLength(3)
    })

    it('places a widget that is new since the layout was saved below everything else', () => {
        const saved = [p('a', 0, 0, 2, 3), p('b', 2, 0, 2, 1)]

        const result = reconcileLayout(saved, DEFAULTS)

        expect(result).toEqual([...saved, p('c', 4, 3, 4, 1)]) // default x, w, h; y = bottom (0+3)
    })

    it('stacks several new widgets one under the other', () => {
        const result = reconcileLayout([p('a', 0, 0, 2, 2)], DEFAULTS)

        expect(result.slice(1)).toEqual([
            p('b', 2, 2, 2, 1),
            p('c', 4, 3, 4, 1),
        ])
    })

    it.each([
        ['a width of 0', p('a', 0, 0, 0, 1)],
        ['a height of 0', p('a', 0, 0, 1, 0)],
        ['a negative position', p('a', -1, 0)],
        ['a fractional position', p('a', 0.5, 0)],
        ['a position outside the grid', p('a', GRID_COLUMNS, 0)],
        ['a widget wider than the grid allows from its x', p('a', 11, 0, 2, 1)],
        ['a non-finite size', p('a', 0, 0, Number.NaN, 1)],
    ])(
        'does not trust %s: the widget is placed like a new one',
        (_label, broken) => {
            const result = reconcileLayout(
                [broken, p('b', 2, 0), p('c', 4, 0, 4, 1)],
                DEFAULTS
            )

            expect(result.find((x) => x.widgetId === 'a')).toEqual(
                p('a', 0, 1, 2, 1)
            )
        }
    )

    it('does not change its inputs', () => {
        const saved = [p('a', 0, 0)]
        const before = JSON.stringify([saved, DEFAULTS])

        reconcileLayout(saved, DEFAULTS)

        expect(JSON.stringify([saved, DEFAULTS])).toBe(before)
    })

    it('settles: reconciling a reconciled layout changes nothing', () => {
        const once = reconcileLayout([p('b', 0, 0), p('x', 1, 1)], DEFAULTS)

        expect(reconcileLayout(once, DEFAULTS)).toEqual(once)
    })
})

describe('placementsEqual', () => {
    it('is true for the same placements, whatever their order', () => {
        expect(
            placementsEqual(
                [p('a', 0, 0), p('b', 2, 0)],
                [p('b', 2, 0), p('a', 0, 0)]
            )
        ).toBe(true)
    })

    it.each([
        ['a moved widget', [p('a', 1, 0), p('b', 2, 0)]],
        ['a resized widget', [p('a', 0, 0, 3, 1), p('b', 2, 0)]],
        ['a missing widget', [p('a', 0, 0)]],
        ['an extra widget', [p('a', 0, 0), p('b', 2, 0), p('c', 4, 0)]],
    ])('is false for %s', (_label, other) => {
        expect(placementsEqual([p('a', 0, 0), p('b', 2, 0)], other)).toBe(false)
    })
})
