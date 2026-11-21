import type {
    AccessTokenResult,
    AuthFailureReason,
    AuthState,
} from '@/domain/auth/AuthToken'
import type { Result } from '@/domain/shared/Result'
import type { ObservableStore } from './Store'

export interface AuthSession extends ObservableStore<AuthState> {
    /** A token for a request, renewing it silently if needed. Never throws. */
    getAccessToken(): Promise<AccessTokenResult>
    /** User-initiated; concurrent calls share one prompt. */
    signIn(): Promise<Result<void, AuthFailureReason>>
    /** Forgets the token and revokes it at the provider (best effort). */
    signOut(): Promise<void>
    /** The API answered 401: make the next request renew the token. */
    rejectAccessToken(): void
}
