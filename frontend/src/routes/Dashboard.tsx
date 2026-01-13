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
import { PADDING } from '../assets/styles/theme'
import { memo, useCallback, useMemo, useRef } from 'react'
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

// Default layout matching the original grid structure (12-column grid)
const DEFAULT_LAYOUT: WidgetLayout[] = [
    { i: 'time', x: 0, y: 0, w: 6, h: 1 },
    { i: 'birthdays', x: 6, y: 0, w: 6, h: 1 },
    { i: 'events', x: 0, y: 1, w: 12, h: 1 },
    { i: 'trains', x: 0, y: 2, w: 12, h: 1 },
    { i: 'current-weather', x: 0, y: 3, w: 12, h: 1 },
    { i: 'hourly-weather', x: 0, y: 4, w: 12, h: 1 },
    { i: 'daily-forecast', x: 0, y: 5, w: 12, h: 1 },
]

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
            rowHeight: 200,
            margin: [PADDING, PADDING * 0.5] as const,
            containerPadding: [0, 0] as const,
            maxRows: Infinity,
        }),
        []
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
                    onDragStop={(newLayout: RGLLayout) =>
                        handleLayoutChange(newLayout)
                    }
                    onResizeStop={(newLayout: RGLLayout) =>
                        handleLayoutChange(newLayout)
                    }
                >
                    <Box key="time" sx={{ background: 'transparent' }}>
                        <Time />
                    </Box>
                    <Box key="birthdays" sx={{ background: 'transparent' }}>
                        <Birthdays />
                    </Box>
                    <Box key="events" sx={{ background: 'transparent' }}>
                        <UpcomingEvents />
                    </Box>
                    <Box key="trains" sx={{ background: 'transparent' }}>
                        <TrainTimes />
                    </Box>
                    <Box
                        key="current-weather"
                        sx={{ background: 'transparent' }}
                    >
                        <CurrentWeather />
                    </Box>
                    <Box
                        key="hourly-weather"
                        sx={{ background: 'transparent' }}
                    >
                        <HourlyWeather />
                    </Box>
                    <Box
                        key="daily-forecast"
                        sx={{ background: 'transparent' }}
                    >
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
