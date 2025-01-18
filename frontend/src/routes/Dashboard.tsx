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
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                gap: PADDING,
            }}
        >
            <Time />
            <Birthdays />
            <UpcomingEvents />
            <CurrentWeather />
            <HourlyWeather />
            <DailyForecast />
        </Box>
    )
}
