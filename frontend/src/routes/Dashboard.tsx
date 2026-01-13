import CurrentWeather from '../components/current_weather/CurrentWeather'
import Time from '../components/time/Time'
import { Box } from '@mui/material'
import DailyForecast from '../components/daily_forecast/DailyForecast'
import Birthdays from '../components/birthdays/Birthdays'
import HourlyWeather from '../components/hourly_forecast/HourlyForecast'
import UpcomingEvents from '../components/upcoming_events/UpcomingEvents'
import TrainTimes from '../components/train_times/TrainTimes'
import { TimeContextProvider } from '../common/TimeContext'
import { LocationContextProvider } from '../common/LocationContext'
import { memo, useCallback, useMemo, useRef } from 'react'
import { PADDING, SPACING } from '../assets/styles/theme'
import {
    GridLayout,
    useContainerWidth,
    Layout as RGLLayout,
} from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useGetUserSettings } from '../apis/user_settings'
import { patchUserSettings } from '../apis/user_settings'
import { WidgetLayout } from '../models/user_settings'
import { useGridEditContext } from '../common/GridEditContext'
import { DEFAULT_LAYOUT } from '../common/constants'

// Styles for grid items to ensure content is visible
const gridItemSx = {
    background: 'transparent',
    height: '100%',
    overflow: 'visible',
}

const DashboardComponent = () => {
    return (
        <LocationContextProvider>
            <TimeContextProvider>
                <DashBoardItems />
            </TimeContextProvider>
        </LocationContextProvider>
    )
}

const DashBoardItems = memo(() => {
    const { data: userSettings } = useGetUserSettings(true)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { width, containerRef, mounted } = useContainerWidth()
    const { isEditMode } = useGridEditContext()

    // Use saved layout or default layout
    const layout = useMemo<WidgetLayout[]>(() => {
        if (
            userSettings?.widget_layout &&
            userSettings.widget_layout.length > 0
        ) {
            return userSettings.widget_layout
        }
        return DEFAULT_LAYOUT
    }, [userSettings?.widget_layout])

    // Grid configuration
    const gridConfig = useMemo(
        () => ({
            cols: 12,
            rowHeight: 190,
            margin: [PADDING * SPACING, PADDING * SPACING] as const,
            containerPadding: [0, 0] as const,
            maxRows: Infinity,
        }),
        []
    )

    // Drag and resize configuration based on edit mode
    const dragConfig = useMemo(
        () => ({
            enabled: isEditMode,
        }),
        [isEditMode]
    )

    const resizeConfig = useMemo(
        () => ({
            enabled: isEditMode,
        }),
        [isEditMode]
    )

    // Save layout to backend when it changes (debounced)
    const handleLayoutChange = useCallback((newLayout: RGLLayout) => {
        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Debounce the save to avoid too many API calls
        saveTimeoutRef.current = setTimeout(() => {
            const widgetLayout: WidgetLayout[] = newLayout.map((item) => ({
                i: item.i,
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
            }))

            // Save to backend
            patchUserSettings({ widget_layout: widgetLayout }).catch(
                (error) => {
                    console.error('Failed to save widget layout:', error)
                }
            )
        }, 500) // Wait 500ms after last change
    }, [])

    return (
        <Box ref={containerRef} sx={{ width: '100%' }}>
            {mounted && (
                <GridLayout
                    className="layout"
                    layout={layout}
                    width={width}
                    gridConfig={gridConfig}
                    dragConfig={dragConfig}
                    resizeConfig={resizeConfig}
                    onDragStop={(newLayout: RGLLayout) =>
                        handleLayoutChange(newLayout)
                    }
                    onResizeStop={(newLayout: RGLLayout) =>
                        handleLayoutChange(newLayout)
                    }
                >
                    <Box key="time" sx={gridItemSx}>
                        <Time />
                    </Box>
                    <Box key="birthdays" sx={gridItemSx}>
                        <Birthdays />
                    </Box>
                    <Box key="events" sx={gridItemSx}>
                        <UpcomingEvents />
                    </Box>
                    <Box key="trains" sx={gridItemSx}>
                        <TrainTimes />
                    </Box>
                    <Box key="current-weather" sx={gridItemSx}>
                        <CurrentWeather />
                    </Box>
                    <Box key="hourly-weather" sx={gridItemSx}>
                        <HourlyWeather />
                    </Box>
                    <Box key="daily-forecast" sx={gridItemSx}>
                        <DailyForecast />
                    </Box>
                </GridLayout>
            )}
        </Box>
    )
})

DashBoardItems.displayName = 'DashBoardItems'

export const Dashboard = memo(DashboardComponent)
Dashboard.displayName = 'Dashboard'
