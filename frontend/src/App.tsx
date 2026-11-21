import { memo, type ReactNode } from 'react'
import MenuAppBar from './components/appbar/MenuAppBar'
import { PADDING } from '@/shared/styles/theme'
import { Box } from '@mui/material'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import RouteErrorPage from './routes/RouteErrorPage'
import ErrorPage from './routes/ErrorPage'
import { Dashboard, LayoutEditingProvider } from '@/features/dashboard'
import { Settings } from './routes/Settings'

interface BaseFrameProps {
    children: ReactNode
}

const BaseFrame = memo<BaseFrameProps>(({ children }) => {
    return (
        <>
            <MenuAppBar />
            <Box sx={{ p: PADDING }}>{children}</Box>
        </>
    )
})

BaseFrame.displayName = 'BaseFrame'

const AppFrame = () => {
    return (
        <BaseFrame>
            <Outlet />
        </BaseFrame>
    )
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <AppFrame />,
        errorElement: (
            <BaseFrame>
                <RouteErrorPage />
            </BaseFrame>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'settings',
                element: <Settings />,
            },
            {
                path: 'error',
                element: <ErrorPage />,
            },
        ],
    },
])

export const App = () => {
    return (
        <LayoutEditingProvider>
            <RouterProvider router={router} />
        </LayoutEditingProvider>
    )
}

export default App
