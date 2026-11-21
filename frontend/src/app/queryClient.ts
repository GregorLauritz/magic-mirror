import { QueryClient } from 'react-query'
import type { AppConfig } from '@/app/config'
import { isRetryable } from '@/application/ports/errors'

const RETRY_BASE_DELAY_MS = 300
const RETRY_MAX_DELAY_MS = 5000

/**
 * The server-state cache. Retrying happens in two deliberate layers: the HTTP
 * client already retries transient network failures, and the cache adds at
 * most one more attempt. Failures that cannot succeed on a second try (4xx,
 * auth, bad configuration) are never retried.
 */
export const createQueryClient = (config: AppConfig): QueryClient =>
    new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: true,
                staleTime: config.staleTimeMs,
                retry: (failureCount, error) =>
                    failureCount < 1 && isRetryable(error),
                retryDelay: (attempt) =>
                    Math.min(
                        RETRY_BASE_DELAY_MS * 2 ** attempt,
                        RETRY_MAX_DELAY_MS
                    ),
            },
        },
    })
