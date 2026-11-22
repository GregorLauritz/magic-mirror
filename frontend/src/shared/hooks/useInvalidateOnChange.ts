import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from 'react-query'

/**
 * Refetches the active queries under `queryKey` whenever `changeKey` changes
 * (e.g. the hour or the day). Disabled queries are left alone, and nothing
 * happens on mount: the previous value starts out as the initial one, so a
 * StrictMode double effect cannot cause a spurious refetch.
 */
export const useInvalidateOnChange = (
    changeKey: string,
    queryKey: QueryKey
): void => {
    const queryClient = useQueryClient()
    const previous = useRef(changeKey)

    useEffect(() => {
        if (previous.current === changeKey) return
        previous.current = changeKey
        void queryClient.invalidateQueries(queryKey)
    }, [changeKey, queryKey, queryClient])
}
