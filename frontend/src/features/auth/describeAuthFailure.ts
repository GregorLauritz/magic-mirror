import type { AuthFailureReason } from '@/domain/auth/AuthToken'

const MESSAGES: Record<AuthFailureReason, string> = {
    access_denied: 'Google sign-in was denied.',
    popup_closed: 'The Google sign-in window was closed before it finished.',
    popup_blocked:
        'Your browser blocked the Google sign-in window. Please allow pop-ups for this site and try again.',
    script_unavailable:
        'Google sign-in could not be loaded. Check your connection and try again.',
    timeout: 'Google sign-in took too long. Please try again.',
    unknown: 'Google sign-in failed.',
}

export const describeAuthFailure = (reason: AuthFailureReason): string =>
    MESSAGES[reason]
