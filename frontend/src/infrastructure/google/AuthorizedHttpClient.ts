import { AuthRequiredError, HttpError } from '@/application/ports/errors'
import type { AuthSession } from '@/application/ports/AuthSession'
import type { HttpClient, HttpRequest } from '@/application/ports/HttpClient'

/**
 * Decorates an HttpClient for Google APIs: it adds the bearer token (renewing
 * it if needed) so providers and use cases never handle tokens. A 401 means
 * Google revoked the token, so the next call renews it.
 */
export class AuthorizedHttpClient implements HttpClient {
    constructor(
        private readonly inner: HttpClient,
        private readonly auth: AuthSession
    ) {}

    async getJson<T = unknown>(request: HttpRequest): Promise<T> {
        const token = await this.auth.getAccessToken()
        if (token.status === 'signed-out')
            throw new AuthRequiredError('signed-out')
        if (token.status === 'refresh-failed') {
            throw new AuthRequiredError('refresh-failed', token.reason)
        }

        try {
            return await this.inner.getJson<T>({
                ...request,
                headers: {
                    ...request.headers,
                    Authorization: `Bearer ${token.accessToken}`,
                },
            })
        } catch (error) {
            if (error instanceof HttpError && error.status === 401) {
                this.auth.rejectAccessToken()
                throw new AuthRequiredError('rejected')
            }
            throw error
        }
    }
}
