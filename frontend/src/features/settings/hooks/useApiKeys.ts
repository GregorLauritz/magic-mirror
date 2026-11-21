import { useServices } from '@/app/services/useServices'
import { useStoreSnapshot } from '@/shared/hooks/useStoreSnapshot'

/**
 * The user's API keys. Synchronous: the value is there on the first render
 * (the store reads storage once, at startup).
 */
export const useApiKeys = () => {
    const { apiKeys: store } = useServices()
    const apiKeys = useStoreSnapshot(store)
    return { apiKeys, isLoading: false as const, setApiKeys: store.set }
}
