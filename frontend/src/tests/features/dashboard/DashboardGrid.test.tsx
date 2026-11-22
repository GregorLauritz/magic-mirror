import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'

// The grid library measures real layout, which jsdom does not have. It is
// replaced by a stand-in that renders its children and exposes its props, so
// what is tested here is the wiring: which layout it gets, when it can be
// edited, and what is saved when the user lets go.
interface GridProps {
    layout: Array<{ i: string; x: number; y: number; w: number; h: number }>
    width: number
    dragConfig: { enabled: boolean }
    resizeConfig: { enabled: boolean }
    onDragStop: (layout: GridProps['layout']) => void
    onResizeStop: (layout: GridProps['layout']) => void
    children: ReactNode
}
const captured: { props?: GridProps } = {}

vi.mock('react-grid-layout', () => ({
    GridLayout: (props: GridProps) => {
        captured.props = props
        return <div data-testid="grid">{props.children}</div>
    },
    useContainerWidth: () => ({
        width: 1200,
        containerRef: { current: null },
        mounted: true,
    }),
}))
vi.mock('react-grid-layout/css/styles.css', () => ({}))
vi.mock('react-resizable/css/styles.css', () => ({}))

import { Dashboard } from '@/features/dashboard/Dashboard'
import { LayoutEditingProvider } from '@/features/dashboard/LayoutEditingProvider'
import { useLayoutEditing } from '@/features/dashboard/layoutEditingContext'
import { DEFAULT_LAYOUT } from '@/features/dashboard/widgetRegistry'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderWithDeps } from '../../support/renderWithDeps'

const NEW_POSITIONS = [
    { i: 'time', x: 4, y: 0, w: 2, h: 1 },
    { i: 'events', x: 0, y: 0, w: 4, h: 2 },
]

const Toggle = () => {
    const { toggle } = useLayoutEditing()
    return <button onClick={toggle}>toggle</button>
}

const setup = (savedLayout?: unknown[]) => {
    const store = new InMemoryKeyValueStore()
    if (savedLayout)
        store.set(
            STORAGE_KEYS.userSettings,
            JSON.stringify({ widget_layout: savedLayout })
        )
    const test = createTestContainer({ localStore: store })
    renderWithDeps(
        <LayoutEditingProvider>
            <Toggle />
            <Dashboard />
        </LayoutEditingProvider>,
        { deps: test.deps }
    )
    return { store, test }
}

beforeEach(() => {
    captured.props = undefined
})

describe('Dashboard', () => {
    it('shows every widget of the registry', () => {
        setup()

        expect(screen.getByText('Birthdays')).toBeInTheDocument() // birthdays
        expect(
            screen.getByText('Sign in with Google in Settings')
        ).toBeInTheDocument() // events
        expect(
            screen.getByText(
                'No train connections configured. Please add them in the settings'
            )
        ).toBeInTheDocument()
        expect(
            screen.getAllByText(/Longitude and or latitude are not set/)
        ).toHaveLength(3) // the weather widgets
        expect(screen.getByText(/Timezone UTC/)).toBeInTheDocument() // the clock
    })

    it('lays the widgets out by the default layout', () => {
        setup()

        expect(captured.props?.layout).toEqual(
            DEFAULT_LAYOUT.map((p) => ({
                i: p.widgetId,
                x: p.x,
                y: p.y,
                w: p.w,
                h: p.h,
            }))
        )
    })

    it('lays the widgets out by the saved layout', () => {
        setup([{ i: 'time', x: 8, y: 0, w: 2, h: 1 }])

        expect(captured.props?.layout[0]).toEqual({
            i: 'time',
            x: 8,
            y: 0,
            w: 2,
            h: 1,
        })
    })

    it('can only be rearranged while layout editing is on', () => {
        setup()
        expect(captured.props?.dragConfig.enabled).toBe(false)
        expect(captured.props?.resizeConfig.enabled).toBe(false)

        act(() => screen.getByText('toggle').click())

        expect(captured.props?.dragConfig.enabled).toBe(true)
        expect(captured.props?.resizeConfig.enabled).toBe(true)
    })

    it.each(['onDragStop', 'onResizeStop'] as const)(
        'saves the layout when %s fires',
        (handler) => {
            const { store } = setup()

            act(() => captured.props?.[handler](NEW_POSITIONS))

            const saved = JSON.parse(
                store.get(STORAGE_KEYS.userSettings) ?? '{}'
            ).widget_layout
            expect(saved).toEqual(NEW_POSITIONS)
        }
    )

    it('keeps the widgets it was not told about when it saves', () => {
        const { store } = setup()

        act(() => captured.props?.onDragStop(NEW_POSITIONS))

        // widgets missing from the reported layout are put back by the next reconcile
        const saved = JSON.parse(
            store.get(STORAGE_KEYS.userSettings) ?? '{}'
        ).widget_layout
        expect(saved).toHaveLength(2)
        expect(captured.props?.layout.map((item) => item.i)).toHaveLength(
            DEFAULT_LAYOUT.length
        )
    })
})
