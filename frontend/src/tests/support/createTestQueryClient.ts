import { QueryClient } from 'react-query'

/** A QueryClient that never retries and never keeps data between tests. */
export const createTestQueryClient = (): QueryClient =>
    new QueryClient({
        defaultOptions: { queries: { retry: false, cacheTime: 0 } },
    })
