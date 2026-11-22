import type { AuthToken } from '@/domain/auth/AuthToken'

export interface TokenStore {
    /** Never throws: anything unreadable counts as "no token". */
    load(): AuthToken | undefined
    save(token: AuthToken): void
    clear(): void
}
