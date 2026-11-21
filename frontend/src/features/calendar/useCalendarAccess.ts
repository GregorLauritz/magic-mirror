import { useAuth } from '@/features/auth'

/** What the Google account allows the calendar widgets to do right now. */
export type CalendarAccess = 'granted' | 'sign-in-needed' | 'renewal-needed'

export const useCalendarAccess = (): CalendarAccess => {
    const { state } = useAuth()
    switch (state.status) {
        case 'signed-in':
            return 'granted'
        case 'needs-reauth':
            return 'renewal-needed'
        default:
            return 'sign-in-needed'
    }
}
