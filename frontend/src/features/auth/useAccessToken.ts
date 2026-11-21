import { useCallback } from 'react'
import { useServices } from '@/app/services/useServices'
import { AuthRequiredError } from '@/application/ports/errors'

/**
 * Transitional bridge (removed in step S7): the legacy Google Calendar calls
 * still take an access token as an argument. S7 moves them behind a provider
 * that gets its token from AuthorizedHttpClient.
 */
export const useAccessToken = (): (() => Promise<string>) => {
    const { auth } = useServices()
    return useCallback(async () => {
        const result = await auth.getAccessToken()
        if (result.status === 'ok') return result.accessToken
        throw result.status === 'signed-out'
            ? new AuthRequiredError('signed-out')
            : new AuthRequiredError('refresh-failed', result.reason)
    }, [auth])
}
