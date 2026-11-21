import type { ApiKeyRepository } from '@/application/ports/ApiKeyRepository'
import type { KeyValueStore } from '@/application/ports/KeyValueStore'
import { EMPTY_API_KEYS, type ApiKeys } from '@/domain/settings/ApiKeys'
import { STORAGE_KEYS } from './storageKeys'

type Json = Record<string, unknown>

const readObject = (raw: string | null): Json => {
    if (raw === null) return {}
    try {
        const parsed: unknown = JSON.parse(raw)
        return typeof parsed === 'object' &&
            parsed !== null &&
            !Array.isArray(parsed)
            ? (parsed as Json)
            : {}
    } catch {
        return {}
    }
}

/**
 * Persists the API keys under `magic-mirror.api-keys`, the key and shape earlier
 * versions used ({ geocodeApiKey, openWeatherMapApiKey }). Writes merge into the
 * stored object, so a field this version no longer manages (the unused
 * openWeatherMapApiKey) survives, and rolling back to an older build loses
 * nothing.
 */
export class LocalStorageApiKeyRepository implements ApiKeyRepository {
    constructor(private readonly store: KeyValueStore) {}

    load(): ApiKeys {
        const stored = readObject(this.store.get(STORAGE_KEYS.apiKeys))
        return {
            geocodeApiKey:
                typeof stored.geocodeApiKey === 'string'
                    ? stored.geocodeApiKey
                    : EMPTY_API_KEYS.geocodeApiKey,
        }
    }

    save(keys: ApiKeys): boolean {
        const previous = readObject(this.store.get(STORAGE_KEYS.apiKeys))
        return this.store.set(
            STORAGE_KEYS.apiKeys,
            JSON.stringify({ ...previous, geocodeApiKey: keys.geocodeApiKey })
        )
    }

    clear(): void {
        this.store.remove(STORAGE_KEYS.apiKeys)
    }
}
