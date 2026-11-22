import type { KeyValueStore } from '@/application/ports/KeyValueStore'
import type { TokenStore } from '@/application/ports/TokenStore'
import type { AuthToken } from '@/domain/auth/AuthToken'
import { instant } from '@/domain/shared/time'
import { STORAGE_KEYS } from './storageKeys'

/**
 * The Google access token in the session storage (it is gone when the browser
 * closes), under the key and shape earlier versions used:
 * { accessToken: string, expiresAt: epoch ms }.
 */
export class SessionTokenStore implements TokenStore {
    constructor(private readonly store: KeyValueStore) {}

    load(): AuthToken | undefined {
        const raw = this.store.get(STORAGE_KEYS.googleToken)
        if (raw === null) return undefined
        try {
            const parsed: unknown = JSON.parse(raw)
            if (typeof parsed !== 'object' || parsed === null) return undefined
            const { accessToken, expiresAt } = parsed as Record<string, unknown>
            if (typeof accessToken !== 'string' || accessToken === '')
                return undefined
            if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt))
                return undefined
            return { accessToken, expiresAt: instant(expiresAt) }
        } catch {
            return undefined
        }
    }

    save(token: AuthToken): void {
        this.store.set(
            STORAGE_KEYS.googleToken,
            JSON.stringify({
                accessToken: token.accessToken,
                expiresAt: token.expiresAt,
            })
        )
    }

    clear(): void {
        this.store.remove(STORAGE_KEYS.googleToken)
    }
}
