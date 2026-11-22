import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { SettingsPage } from './SettingsPage'

/** The settings page as a route: "Back" returns to the dashboard. */
export const SettingsRoute = () => {
    const navigate = useNavigate()
    return <SettingsPage onBack={() => navigate(ROUTES.dashboard)} />
}
