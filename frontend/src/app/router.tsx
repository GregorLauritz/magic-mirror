import {
    createBrowserRouter,
    createMemoryRouter,
    type RouteObject,
} from 'react-router-dom'
import { Dashboard } from '@/features/dashboard'
import { ErrorPage, RouteErrorPage } from '@/features/errors'
import { SettingsRoute } from '@/features/settings-page'
import { AppFrame, AppLayout } from '@/features/shell'
import { ROUTES } from './routes'

const relative = (path: string) => path.replace(/^\//, '')

const routes = (): RouteObject[] => [
    {
        path: ROUTES.dashboard,
        element: <AppLayout />,
        errorElement: (
            <AppFrame>
                <RouteErrorPage />
            </AppFrame>
        ),
        children: [
            { index: true, element: <Dashboard /> },
            { path: relative(ROUTES.settings), element: <SettingsRoute /> },
            { path: relative(ROUTES.error), element: <ErrorPage /> },
        ],
    },
]

/**
 * The app's router. In the browser it follows the address bar; tests pass
 * `initialEntries` to start at a path without one.
 */
export const createAppRouter = ({
    initialEntries,
}: { initialEntries?: string[] } = {}) =>
    initialEntries
        ? createMemoryRouter(routes(), { initialEntries })
        : createBrowserRouter(routes())
