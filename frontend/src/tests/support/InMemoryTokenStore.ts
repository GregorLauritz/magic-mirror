import type { TokenStore } from '@/application/ports/TokenStore'
import type { AuthToken } from '@/domain/auth/AuthToken'

export class InMemoryTokenStore implements TokenStore {
    constructor(public token?: AuthToken) {}

    load(): AuthToken | undefined {
        return this.token
    }

    save(token: AuthToken): void {
        this.token = token
    }

    clear(): void {
        this.token = undefined
    }
}
