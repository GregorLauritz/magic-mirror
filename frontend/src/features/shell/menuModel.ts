import { ROUTES } from '@/app/routes'

export type MenuAction =
    | 'refresh'
    | 'dashboard'
    | 'settings'
    | 'resetLayout'
    | 'signOut'
    | 'clearLocalData'

/** What to ask before an action that cannot be undone. */
export interface Confirmation {
    readonly title: string
    readonly message: string
    readonly confirmLabel: string
}

export interface MenuEntry {
    readonly action: MenuAction
    readonly label: string
    readonly confirm?: Confirmation
}

const ENTRIES: Record<MenuAction, MenuEntry> = {
    refresh: { action: 'refresh', label: 'Refresh' },
    dashboard: { action: 'dashboard', label: 'Dashboard' },
    settings: { action: 'settings', label: 'Settings' },
    resetLayout: {
        action: 'resetLayout',
        label: 'Reset Layout',
        confirm: {
            title: 'Reset the layout?',
            message: 'The widgets go back to their default places.',
            confirmLabel: 'Reset',
        },
    },
    signOut: { action: 'signOut', label: 'Logout' },
    clearLocalData: {
        action: 'clearLocalData',
        label: 'Clear Local Data',
        confirm: {
            title: 'Clear all local data?',
            message:
                'This removes your settings, API keys and Google sign-in from this browser and reloads the page.',
            confirmLabel: 'Clear data',
        },
    },
}

const MENUS: Readonly<Record<string, readonly MenuAction[]>> = {
    [ROUTES.dashboard]: [
        'refresh',
        'settings',
        'resetLayout',
        'signOut',
        'clearLocalData',
    ],
    [ROUTES.settings]: ['signOut', 'clearLocalData'],
}

// Any other page (an error, a path that does not exist) still gets a way out.
const OTHER_PAGES: readonly MenuAction[] = [
    'dashboard',
    'settings',
    'signOut',
    'clearLocalData',
]

/** The menu entries for the page at `pathname`. */
export const menuFor = (pathname: string): readonly MenuEntry[] =>
    (MENUS[pathname] ?? OTHER_PAGES).map((action) => ENTRIES[action])

/** Only the dashboard has a layout to edit. */
export const showsLayoutToggle = (pathname: string): boolean =>
    pathname === ROUTES.dashboard
