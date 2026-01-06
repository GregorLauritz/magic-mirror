import CurrentWeather from '../components/current_weather/CurrentWeather'
import Time from '../components/time/Time'
import { Box } from '@mui/material'
import DailyForecast from '../components/daily_forecast/DailyForecast'
import Birthdays from '../components/birthdays/Birthdays'
import HourlyWeather from '../components/hourly_forecast/HourlyForecast'
import UpcomingEvents from '../components/upcoming_events/UpcomingEvents'
import { TimeContextProvider } from '../common/TimeContext'
import { LocationContextProvider } from '../common/LocationContext'
import { PADDING } from '../assets/styles/theme'

export const Dashboard = () => {
    return (
        <LocationContextProvider>
            <TimeContextProvider>
                <DashBoardItems />
            </TimeContextProvider>
        </LocationContextProvider>
    )
}

const DashBoardItems = () => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns:
                    'repeat(auto-fit, minmax(min(155px, 100%), 1fr))',
                gap: PADDING,
                width: '100%',
            }}
        >
            <Box sx={{ gridColumn: 'span 1' }}>
                <Time />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
                <Birthdays />
            </Box>
            <Box
                sx={{
                    gridColumn: { xs: 'span 1', sm: 'span 2' },
                }}
            >
                <UpcomingEvents />
            </Box>
            <Box
                sx={{
                    gridColumn: { xs: 'span 1', sm: 'span 2' },
                }}
            >
                <CurrentWeather />
            </Box>
            <Box
                sx={{
                    gridColumn: { xs: 'span 1', sm: 'span 2' },
                }}
            >
                <HourlyWeather />
            </Box>
            <Box
                sx={{
                    gridColumn: { xs: 'span 1', sm: 'span 2' },
                }}
            >
                <DailyForecast />
            </Box>
        </Box>
    )
}
