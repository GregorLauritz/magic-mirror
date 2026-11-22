import type { ApiKeys } from '@/domain/settings/ApiKeys'

export interface ApiKeyRepository {
    /** Never throws: unreadable data yields the defaults. */
    load(): ApiKeys
    /** False when the keys could not be persisted. */
    save(keys: ApiKeys): boolean
    clear(): void
}
