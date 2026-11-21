import { useQuery, type UseQueryResult } from 'react-query'
import { useAuth } from './useAuth'

interface Options {
    /** Extra condition, on top of "the user is signed in". */
    readonly enabled?: boolean
    readonly refetchIntervalMs?: number
}

/**
 * A query that needs a Google account. It runs only for a user who is signed in
 * (or whose renewal failed, so polling can pick up again by itself on a kiosk),
 * and stores its data under the 'google' key, so signing out can purge it.
 * `enabled` is the only gate; nothing should call `refetch()` to get around it.
 */
export function useAuthenticatedQuery<T>(
    key: readonly unknown[],
    fn: (context: { signal?: AbortSignal }) => Promise<T>,
    options: Options = {}
): UseQueryResult<T, Error> {
    const { state } = useAuth()
    const eligible =
        state.status === 'signed-in' || state.status === 'needs-reauth'

    return useQuery<T, Error>(
        ['google', ...key],
        ({ signal }) => fn({ signal }),
        {
            enabled: eligible && (options.enabled ?? true),
            refetchInterval: options.refetchIntervalMs ?? false,
        }
    )
}
