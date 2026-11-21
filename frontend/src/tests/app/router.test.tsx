import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider } from 'react-router-dom'

// The grid library needs real layout measurements, which jsdom lacks.
vi.mock('react-grid-layout', () => ({
    GridLayout: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    useContainerWidth: () => ({
        width: 1200,
        containerRef: { current: null },
        mounted: true,
    }),
}))
vi.mock('react-grid-layout/css/styles.css', () => ({}))
vi.mock('react-resizable/css/styles.css', () => ({}))

import { AppProviders } from '@/app/AppProviders'
import { createAppRouter } from '@/app/router'
import { ROUTES } from '@/app/routes'
import { createTestContainer } from '../support/createTestContainer'

const renderApp = (path: string) => {
    const test = createTestContainer()
    const router = createAppRouter({ initialEntries: [path] })
    render(
        <AppProviders deps={test.deps}>
            <RouterProvider router={router} />
        </AppProviders>
    )
    return { router, test, user: userEvent.setup() }
}

describe('routes', () => {
    it('names the paths of the app', () => {
        expect(ROUTES).toEqual({
            dashboard: '/',
            settings: '/settings',
            error: '/error',
        })
    })
})

describe('createAppRouter', () => {
    it('shows the dashboard inside the frame', () => {
        renderApp('/')

        expect(screen.getByText('Magic Mirror')).toBeInTheDocument()
        expect(screen.getByText('Birthdays')).toBeInTheDocument()
        expect(
            screen.getByLabelText('toggle layout editing')
        ).toBeInTheDocument()
    })

    it('shows the settings page, and goes back to the dashboard from it', async () => {
        const { router, user } = renderApp('/settings')
        expect(screen.getByLabelText('City')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Back' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/'))
        expect(await screen.findByText('Birthdays')).toBeInTheDocument()
    })

    it('shows the error page that is asked for', () => {
        renderApp('/error?type=google_signin_failed')

        expect(
            screen.getByRole('heading', { name: 'Google sign-in failed!' })
        ).toBeInTheDocument()
    })

    it('shows a not-found page inside the frame, with a working menu (B9)', async () => {
        const { user } = renderApp('/nope')

        expect(
            screen.getByRole('heading', { name: 'Page not found!' })
        ).toBeInTheDocument()
        await user.click(screen.getByLabelText('account of current user'))
        expect(
            await screen.findByRole('menuitem', { name: 'Dashboard' })
        ).toBeInTheDocument()
    })

    it('starts at the browser address when it is not given entries', () => {
        window.history.pushState({}, '', '/settings')

        const router = createAppRouter()

        expect(router.state.location.pathname).toBe('/settings')
        router.dispose()
        window.history.pushState({}, '', '/')
    })
})
