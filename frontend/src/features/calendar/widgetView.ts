import type { CalendarAccess } from './useCalendarAccess'

/** What a calendar widget shows. */
export type WidgetView = 'sign-in' | 'renew' | 'loading' | 'error' | 'ready'

export const RENEW_MESSAGE = 'Google sign-in expired. Sign in again in Settings'

interface Inputs {
    readonly access: CalendarAccess
    readonly hasData: boolean
    readonly isError: boolean
}

/**
 * Data that is already there is shown, whatever happened since (a kiosk should
 * keep its last schedule through a failed refresh). Without data, the reason
 * is the sign-in first, then the loading state, then the failure.
 */
export const widgetView = ({
    access,
    hasData,
    isError,
}: Inputs): WidgetView => {
    if (access === 'sign-in-needed') return 'sign-in'
    if (hasData) return 'ready'
    if (access === 'renewal-needed') return 'renew'
    if (isError) return 'error'
    return 'loading'
}
