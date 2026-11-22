import { describe, expect, it } from 'vitest'
import {
    describePageError,
    describeRouteError,
} from '@/features/errors/describeError'

const UNKNOWN = {
    title: 'Unknown error!',
    details: 'We have no idea what happened... Please try again!',
    backTo: '/',
}

describe('describePageError (the /error?type= page)', () => {
    it('knows the failed Google sign-in and sends the user to the settings', () => {
        expect(describePageError('google_signin_failed')).toEqual({
            title: 'Google sign-in failed!',
            details:
                'We could not sign you in with Google. Please try again from Settings.',
            backTo: '/settings',
        })
    })

    it.each([null, '', 'something-else'])('does not know %j', (type) => {
        expect(describePageError(type)).toEqual(UNKNOWN)
    })
})

describe('describeRouteError', () => {
    const response = (status: number, statusText = '') => ({
        status,
        statusText,
        internal: true,
        data: '',
    })

    it('says a page does not exist, and goes to the dashboard (there may be no history to go back to)', () => {
        expect(describeRouteError(response(404, 'Not Found'))).toEqual({
            title: 'Page not found!',
            details: 'The page you are looking for does not exist!',
            backTo: '/',
        })
    })

    it('names other error responses by their status', () => {
        expect(describeRouteError(response(403, 'Forbidden'))).toEqual({
            title: 'Error 403!',
            details: 'Forbidden',
            backTo: '/',
        })
    })

    it('has a text for a response without a status text', () => {
        expect(describeRouteError(response(500)).details).toBe(
            'The request could not be completed.'
        )
    })

    it('says something went wrong for an exception, with its message (not "server error": there is no server)', () => {
        expect(describeRouteError(new Error('kaboom'))).toEqual({
            title: 'Something went wrong!',
            details: 'kaboom',
            backTo: '/',
        })
    })

    it('has a text for an exception without a message', () => {
        expect(describeRouteError(new Error('')).details).toBe(
            'An unexpected error occurred. Please try again!'
        )
    })

    it.each([undefined, null, 'text', 42, {}])('does not know %j', (error) => {
        expect(describeRouteError(error)).toEqual(UNKNOWN)
    })
})
