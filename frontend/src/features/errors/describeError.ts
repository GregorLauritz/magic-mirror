import { isRouteErrorResponse } from 'react-router-dom'
import { ROUTES } from '@/app/routes'

/** Where the "Back" button leads: a path, or one step back in the history. */
export type BackTarget = string | -1

export interface ErrorDescription {
    readonly title: string
    readonly details: string
    readonly backTo: BackTarget
}

const UNKNOWN: ErrorDescription = {
    title: 'Unknown error!',
    details: 'We have no idea what happened... Please try again!',
    backTo: ROUTES.dashboard,
}

/** The page behind `/error?type=...`. */
export const describePageError = (type: string | null): ErrorDescription => {
    switch (type) {
        case 'google_signin_failed':
            return {
                title: 'Google sign-in failed!',
                details:
                    'We could not sign you in with Google. Please try again from Settings.',
                backTo: ROUTES.settings,
            }
        default:
            return UNKNOWN
    }
}

/** What the router caught: a missing page, an error response or an exception. */
export const describeRouteError = (error: unknown): ErrorDescription => {
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return {
                title: 'Page not found!',
                details: 'The page you are looking for does not exist!',
                backTo: ROUTES.dashboard,
            }
        }
        return {
            title: `Error ${error.status}!`,
            details: error.statusText || 'The request could not be completed.',
            backTo: ROUTES.dashboard,
        }
    }
    if (error instanceof Error) {
        return {
            title: 'Something went wrong!',
            details:
                error.message ||
                'An unexpected error occurred. Please try again!',
            backTo: ROUTES.dashboard,
        }
    }
    return UNKNOWN
}
