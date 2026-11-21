import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { useLayoutEditing } from '@/features/dashboard'
import { AppFrame } from '@/features/shell'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderWithDeps } from '../../support/renderWithDeps'

const Probes = () => {
    const { isEditing } = useLayoutEditing()
    return (
        <>
            <div data-testid="path">{useLocation().pathname}</div>
            <div data-testid="editing">{String(isEditing)}</div>
            <p>page content</p>
        </>
    )
}

const SAVED_LAYOUT = {
    widget_layout: [{ i: 'time', x: 8, y: 0, w: 2, h: 1 }],
    city: 'x',
}

const setup = (route: string) => {
    const local = new InMemoryKeyValueStore()
    local.set(STORAGE_KEYS.userSettings, JSON.stringify(SAVED_LAYOUT))
    const session = new InMemoryKeyValueStore()
    session.set(STORAGE_KEYS.googleToken, '{"accessToken":"t","expiresAt":1}')
    const auth = new FakeAuthSession({ status: 'signed-in' })
    const test = createTestContainer({
        localStore: local,
        sessionStore: session,
        authSession: auth,
    })
    const user = userEvent.setup()
    renderWithDeps(
        <AppFrame>
            <Probes />
        </AppFrame>,
        { deps: test.deps, route }
    )
    const openMenu = () =>
        user.click(screen.getByLabelText('account of current user'))
    const choose = async (name: string) => {
        await openMenu()
        await user.click(await screen.findByRole('menuitem', { name }))
    }
    const menuClosed = (name: string) =>
        waitFor(() =>
            expect(
                screen.queryByRole('menuitem', { name })
            ).not.toBeInTheDocument()
        )
    const storedLayout = () =>
        JSON.parse(local.get(STORAGE_KEYS.userSettings) ?? '{}').widget_layout
    return {
        test,
        user,
        auth,
        local,
        session,
        openMenu,
        choose,
        menuClosed,
        storedLayout,
    }
}

const itemsOf = () =>
    screen.getAllByRole('menuitem').map((item) => item.textContent)

describe('AppFrame', () => {
    it('shows the title and the page', () => {
        setup('/')

        expect(screen.getByText('Magic Mirror')).toBeInTheDocument()
        expect(screen.getByText('page content')).toBeInTheDocument()
    })

    describe('the menu', () => {
        it.each([
            [
                '/',
                [
                    'Refresh',
                    'Settings',
                    'Reset Layout',
                    'Logout',
                    'Clear Local Data',
                ],
            ],
            ['/settings', ['Logout', 'Clear Local Data']],
            ['/error', ['Dashboard', 'Settings', 'Logout', 'Clear Local Data']],
            [
                '/missing-page',
                ['Dashboard', 'Settings', 'Logout', 'Clear Local Data'],
            ],
        ])('on %s offers %j', async (route, expected) => {
            const { openMenu } = setup(route)

            await openMenu()

            expect(itemsOf()).toEqual(expected)
        })

        it('refreshes the data and closes', async () => {
            const { test, choose, menuClosed } = setup('/')
            const invalidate = vi.spyOn(
                test.deps.queryClient,
                'invalidateQueries'
            )

            await choose('Refresh')

            expect(invalidate).toHaveBeenCalledTimes(1)
            await menuClosed('Refresh')
        })

        it('goes to the settings and closes', async () => {
            const { choose, menuClosed } = setup('/')

            await choose('Settings')

            expect(screen.getByTestId('path')).toHaveTextContent('/settings')
            await menuClosed('Settings')
        })

        it('goes to the dashboard from a page that is not one', async () => {
            const { choose } = setup('/missing-page')

            await choose('Dashboard')

            expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/)
        })

        it('signs out, goes to the dashboard and closes', async () => {
            const { auth, choose, menuClosed } = setup('/settings')

            await choose('Logout')

            await waitFor(() =>
                expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/)
            )
            expect(auth.signOuts).toBe(1)
            await menuClosed('Logout')
        })
    })

    describe('destructive actions ask first', () => {
        it('closes the menu, then asks before resetting the layout', async () => {
            const { choose, menuClosed, storedLayout } = setup('/')

            await choose('Reset Layout')

            const dialog = await screen.findByRole('dialog', {
                name: 'Reset the layout?',
            })
            await menuClosed('Reset Layout')
            expect(
                within(dialog).getByText(
                    'The widgets go back to their default places.'
                )
            ).toBeInTheDocument()
            expect(storedLayout()).toHaveLength(1)
        })

        it('keeps the layout when cancelled', async () => {
            const { user, choose, storedLayout } = setup('/')
            await choose('Reset Layout')

            await user.click(
                await screen.findByRole('button', { name: 'Cancel' })
            )

            await waitFor(() =>
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            )
            expect(storedLayout()).toHaveLength(1)
        })

        it('resets the layout when confirmed', async () => {
            const { user, choose, storedLayout } = setup('/')
            await choose('Reset Layout')

            await user.click(
                await screen.findByRole('button', { name: 'Reset' })
            )

            await waitFor(() => expect(storedLayout()).toBeUndefined())
            await waitFor(() =>
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            )
        })

        it('says when the layout could not be reset', async () => {
            const { user, choose, local } = setup('/')
            local.failWrites = true
            await choose('Reset Layout')

            await user.click(
                await screen.findByRole('button', { name: 'Reset' })
            )

            expect(await screen.findByRole('alert')).toHaveTextContent(
                'The layout could not be reset.'
            )
        })

        it('clears nothing until confirmed', async () => {
            const { choose, test, local, session } = setup('/')

            await choose('Clear Local Data')

            expect(
                await screen.findByRole('dialog', {
                    name: 'Clear all local data?',
                })
            ).toBeInTheDocument()
            expect(test.lifecycle.reloads).toBe(0)
            expect(local.keys()).not.toHaveLength(0)
            expect(session.keys()).not.toHaveLength(0)
        })

        it('clears everything of the app and restarts it when confirmed', async () => {
            const { user, choose, test, local, session } = setup('/')
            await choose('Clear Local Data')

            await user.click(
                await screen.findByRole('button', { name: 'Clear data' })
            )

            await waitFor(() => expect(test.lifecycle.reloads).toBe(1))
            expect(local.keys()).toEqual([])
            expect(session.keys()).toEqual([])
        })

        it('does not clear anything when cancelled', async () => {
            const { user, choose, test, local } = setup('/')
            await choose('Clear Local Data')

            await user.click(
                await screen.findByRole('button', { name: 'Cancel' })
            )

            expect(test.lifecycle.reloads).toBe(0)
            expect(local.keys()).not.toHaveLength(0)
        })
    })

    describe('layout editing toggle', () => {
        it('is on the dashboard and switches editing on and off', async () => {
            const { user } = setup('/')
            expect(screen.getByTestId('editing')).toHaveTextContent('false')

            await user.click(screen.getByLabelText('toggle layout editing'))
            expect(screen.getByTestId('editing')).toHaveTextContent('true')
            await user.click(screen.getByLabelText('toggle layout editing'))

            expect(screen.getByTestId('editing')).toHaveTextContent('false')
        })

        it.each(['/settings', '/error'])('is not offered on %s', (route) => {
            setup(route)

            expect(
                screen.queryByLabelText('toggle layout editing')
            ).not.toBeInTheDocument()
        })
    })
})
