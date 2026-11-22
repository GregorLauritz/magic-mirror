import { useServices } from '@/app/services/useServices'
import type { AuthState } from '@/domain/auth/AuthToken'
import { useStoreSnapshot } from '@/shared/hooks/useStoreSnapshot'
import { describeAuthFailure } from './describeAuthFailure'

const errorOf = (state: AuthState): string | undefined => {
    if (state.status === 'signed-out' && state.lastError)
        return describeAuthFailure(state.lastError)
    if (state.status === 'needs-reauth')
        return describeAuthFailure(state.reason)
    return undefined
}

/** The Google sign-in state and its actions, for components. */
export const useAuth = () => {
    const { auth } = useServices()
    const state = useStoreSnapshot(auth)
    return {
        state,
        isSignedIn: state.status === 'signed-in',
        isSigningIn: state.status === 'signing-in',
        needsReauth: state.status === 'needs-reauth',
        /** Why the last sign-in or renewal failed, ready to show. */
        error: errorOf(state),
        // Stable references from the container: safe in effect dependencies.
        signIn: auth.signIn,
        signOut: auth.signOut,
    }
}
