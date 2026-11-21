import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { useServices } from '@/app/services/useServices'
import { useAuth } from '@/features/auth'
import { useResetLayout } from '@/features/dashboard'
import { useResetLocalData } from '@/features/settings'
import { menuFor, type MenuAction, type MenuEntry } from './menuModel'

/**
 * The account menu: which entries the page has, and what choosing one does.
 * The menu closes as soon as an entry is chosen; entries that destroy
 * something wait for a confirmation first.
 */
export const useAppMenu = () => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { queryClient } = useServices()
    const { signOut } = useAuth()
    const resetLayout = useResetLayout()
    const resetLocalData = useResetLocalData()

    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    // Kept after the dialog closes, so its text does not vanish mid-fade.
    const [pending, setPending] = useState<MenuEntry>()
    const [confirming, setConfirming] = useState(false)
    const [notice, setNotice] = useState<string>()

    const entries = useMemo(() => menuFor(pathname), [pathname])

    const run = useCallback(
        async (action: MenuAction) => {
            switch (action) {
                case 'refresh':
                    return void queryClient.invalidateQueries()
                case 'dashboard':
                    return void navigate(ROUTES.dashboard)
                case 'settings':
                    return void navigate(ROUTES.settings)
                case 'resetLayout':
                    if (!resetLayout()) {
                        setNotice('The layout could not be reset.')
                    }
                    return
                case 'signOut':
                    await signOut()
                    return void navigate(ROUTES.dashboard)
                case 'clearLocalData':
                    return resetLocalData()
            }
        },
        [navigate, queryClient, resetLayout, resetLocalData, signOut]
    )

    const select = useCallback(
        (entry: MenuEntry) => {
            setAnchor(null)
            if (entry.confirm) {
                setPending(entry)
                setConfirming(true)
            } else {
                void run(entry.action)
            }
        },
        [run]
    )

    const confirm = useCallback(() => {
        setConfirming(false)
        if (pending) void run(pending.action)
    }, [pending, run])

    return {
        entries,
        anchor,
        isOpen: anchor !== null,
        open: useCallback(
            (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget),
            []
        ),
        close: useCallback(() => setAnchor(null), []),
        select,
        confirmation: pending?.confirm,
        isConfirming: confirming,
        confirm,
        cancel: useCallback(() => setConfirming(false), []),
        notice,
        dismissNotice: useCallback(() => setNotice(undefined), []),
    }
}
