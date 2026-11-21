// Transitional shim: legacy non-hook code (patchUserSettings, useApiKeys, ...)
// still writes to a module-level QueryClient. The composition root reuses this
// instance so the app has exactly one cache. Removed in step S5, when settings
// persistence moves behind a store and nothing outside React touches the cache.
import { createQueryClient } from '../app/queryClient'
import { runtimeConfig } from '../constants/runtimeConfig'

export const queryClient = createQueryClient(runtimeConfig)
