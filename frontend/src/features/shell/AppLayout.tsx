import { Outlet } from 'react-router-dom'
import { AppFrame } from './AppFrame'

/** The frame around whatever page the router selects. */
export const AppLayout = () => (
    <AppFrame>
        <Outlet />
    </AppFrame>
)
