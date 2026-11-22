import { memo, useMemo } from 'react'
import { Box } from '@mui/material'
import { GridLayout, useContainerWidth, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { PADDING, SPACING } from '@/shared/styles/theme'
import { fromGridItems, toGridItems } from './gridAdapter'
import { useLayoutEditing } from './layoutEditingContext'
import { useDashboardLayout } from './useDashboardLayout'
import { WIDGETS } from './widgetRegistry'

// Grid items must not clip or paint over their widget.
const gridItemSx = {
    background: 'transparent',
    height: '100%',
    overflow: 'visible',
}

const GRID_CONFIG = {
    cols: 12,
    rowHeight: 190,
    margin: [PADDING * SPACING, PADDING * SPACING] as const,
    containerPadding: [0, 0] as const,
    maxRows: Infinity,
}

/** The widgets on a grid the user can rearrange while layout editing is on. */
export const Dashboard = memo(() => {
    const { layout, save } = useDashboardLayout()
    const { isEditing } = useLayoutEditing()
    const { width, containerRef, mounted } = useContainerWidth()

    const items = useMemo(() => toGridItems(layout), [layout])
    const interaction = useMemo(() => ({ enabled: isEditing }), [isEditing])
    const handleStop = (next: Layout) => {
        save(fromGridItems(next))
    }

    return (
        <Box ref={containerRef} sx={{ width: '100%' }}>
            {mounted && (
                <GridLayout
                    className="layout"
                    layout={items}
                    width={width}
                    gridConfig={GRID_CONFIG}
                    dragConfig={interaction}
                    resizeConfig={interaction}
                    onDragStop={handleStop}
                    onResizeStop={handleStop}
                >
                    {WIDGETS.map(({ id, Component }) => (
                        <Box key={id} sx={gridItemSx}>
                            <Component />
                        </Box>
                    ))}
                </GridLayout>
            )}
        </Box>
    )
})
Dashboard.displayName = 'Dashboard'
