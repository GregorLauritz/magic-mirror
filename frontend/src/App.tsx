import { QueryClient, QueryClientProvider } from 'react-query'
import { memo, type ReactNode } from 'react'
import MenuAppBar from './components/appbar/MenuAppBar'
import { PADDING } from './assets/styles/theme'
import { Box } from '@mui/material'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import RouteErrorPage from './routes/RouteErrorPage'
import ErrorPage from './routes/ErrorPage'
import { Dashboard } from './routes/Dashboard'
import { Settings } from './routes/Settings'

const queryCache = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true,
            retry: 2,
            retryDelay: 300,
            staleTime: 60000,
        },
    },
})

interface BaseFrameProps {
    children: ReactNode
}

const BaseFrame = memo<BaseFrameProps>(({ children }) => {
    return (
        <>
            <MenuAppBar />
            <Box p={PADDING}>{children}</Box>
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
        <QueryClientProvider client={queryCache}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    )
}

export default App
