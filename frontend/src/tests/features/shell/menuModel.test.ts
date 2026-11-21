import { describe, expect, it } from 'vitest'
import { menuFor, showsLayoutToggle } from '@/features/shell/menuModel'

const actions = (path: string) => menuFor(path).map((entry) => entry.action)

describe('menuFor', () => {
    it('has the dashboard actions on the dashboard', () => {
        expect(actions('/')).toEqual([
            'refresh',
            'settings',
            'resetLayout',
            'signOut',
            'clearLocalData',
        ])
    })

    it('keeps the settings page short', () => {
        expect(actions('/settings')).toEqual(['signOut', 'clearLocalData'])
    })

    it.each(['/error', '/nope', '/settings/x'])(
        'is never empty, even on %s (B9: the legacy menu had no entries there)',
        (path) => {
            expect(actions(path)).toEqual([
                'dashboard',
                'settings',
                'signOut',
                'clearLocalData',
            ])
        }
    )

    it('labels the actions', () => {
        const labels = Object.fromEntries(
            menuFor('/').map((entry) => [entry.action, entry.label])
        )

        expect(labels).toEqual({
            refresh: 'Refresh',
            settings: 'Settings',
            resetLayout: 'Reset Layout',
            signOut: 'Logout',
            clearLocalData: 'Clear Local Data',
        })
    })

    it('asks before the actions that destroy something, and only those', () => {
        const asking = menuFor('/')
            .filter((entry) => entry.confirm !== undefined)
            .map((entry) => entry.action)

        expect(asking).toEqual(['resetLayout', 'clearLocalData'])
    })

    it('explains what the destructive actions do', () => {
        const confirm = (action: string) =>
            menuFor('/').find((entry) => entry.action === action)?.confirm

        expect(confirm('clearLocalData')).toEqual({
            title: 'Clear all local data?',
            message:
                'This removes your settings, API keys and Google sign-in from this browser and reloads the page.',
            confirmLabel: 'Clear data',
        })
        expect(confirm('resetLayout')).toEqual({
            title: 'Reset the layout?',
            message: 'The widgets go back to their default places.',
            confirmLabel: 'Reset',
        })
    })
})

describe('showsLayoutToggle', () => {
    it.each([
        ['/', true],
        ['/settings', false],
        ['/error', false],
    ])('%s: %s', (path, shown) => {
        expect(showsLayoutToggle(path)).toBe(shown)
    })
})
