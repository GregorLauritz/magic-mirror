import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    createMemoryRouter,
    RouterProvider,
    useLocation,
} from 'react-router-dom'
import { ErrorPage, RouteErrorPage } from '@/features/errors'
import { ErrorView } from '@/features/errors/ErrorView'
import { renderWithDeps } from '../../support/renderWithDeps'
import { createTestContainer } from '../../support/createTestContainer'
import { ServicesProvider } from '@/app/services/ServicesProvider'
import { render } from '@testing-library/react'

const Path = () => <div data-testid="path">{useLocation().pathname}</div>

describe('ErrorView', () => {
    it('shows the title, and the details once asked for', async () => {
        const user = userEvent.setup()
        renderWithDeps(
            <ErrorView title="Oops!" details="It broke." backTo="/" />
        )

        expect(
            screen.getByRole('heading', { name: 'Oops!' })
        ).toBeInTheDocument()
        expect(screen.getByAltText('Error')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Details' }))
        expect(screen.getByText('It broke.')).toBeVisible()
    })

    it('goes back to a place', async () => {
        const user = userEvent.setup()
        renderWithDeps(
            <>
                <ErrorView title="t" details="d" backTo="/settings" />
                <Path />
            </>,
            { route: '/error' }
        )

        await user.click(screen.getByRole('button', { name: 'Back' }))

        expect(screen.getByTestId('path')).toHaveTextContent('/settings')
    })

    it('can go one step back in the history', async () => {
        const user = userEvent.setup()
        const router = createMemoryRouter(
            [
                { path: '/', element: <Path /> },
                {
                    path: '/broken',
                    element: <ErrorView title="t" details="d" backTo={-1} />,
                },
            ],
            { initialEntries: ['/', '/broken'], initialIndex: 1 }
        )
        const { deps } = createTestContainer()
        render(
            <ServicesProvider deps={deps}>
                <RouterProvider router={router} />
            </ServicesProvider>
        )

        await user.click(screen.getByRole('button', { name: 'Back' }))

        expect(router.state.location.pathname).toBe('/')
    })
})

describe('ErrorPage', () => {
    it('explains the failure named in the address', () => {
        renderWithDeps(<ErrorPage />, {
            route: '/error?type=google_signin_failed',
        })

        expect(
            screen.getByRole('heading', { name: 'Google sign-in failed!' })
        ).toBeInTheDocument()
    })

    it('has a text for no or an unknown type', () => {
        renderWithDeps(<ErrorPage />, { route: '/error' })

        expect(
            screen.getByRole('heading', { name: 'Unknown error!' })
        ).toBeInTheDocument()
    })
})

describe('RouteErrorPage', () => {
    const renderRoutes = (path: string, element?: React.ReactElement) => {
        const router = createMemoryRouter(
            [
                {
                    path: '/',
                    errorElement: <RouteErrorPage />,
                    children: [
                        { index: true, element: element ?? <div>fine</div> },
                    ],
                },
            ],
            { initialEntries: [path] }
        )
        const { deps } = createTestContainer()
        render(
            <ServicesProvider deps={deps}>
                <RouterProvider router={router} />
            </ServicesProvider>
        )
    }

    it('says when a page does not exist', () => {
        renderRoutes('/nope')

        expect(
            screen.getByRole('heading', { name: 'Page not found!' })
        ).toBeInTheDocument()
    })

    it('says something went wrong when a page throws, and shows why', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const Boom = () => {
            throw new Error('kaboom')
        }

        renderRoutes('/', <Boom />)

        expect(
            screen.getByRole('heading', { name: 'Something went wrong!' })
        ).toBeInTheDocument()
        expect(screen.getByText('kaboom')).toBeInTheDocument()
        vi.restoreAllMocks()
    })
})
