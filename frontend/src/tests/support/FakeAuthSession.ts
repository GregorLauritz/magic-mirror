import type { AuthSession } from '@/application/ports/AuthSession'
import { createStore } from '@/application/support/createStore'
import type {
    AccessTokenResult,
    AuthFailureReason,
    AuthState,
} from '@/domain/auth/AuthToken'
import { ok, type Result } from '@/domain/shared/Result'

/** AuthSession for UI and hook tests: set the state, script the token. */
export class FakeAuthSession implements AuthSession {
    private readonly store = createStore<AuthState>({ status: 'signed-out' })
    readonly getSnapshot = this.store.getSnapshot
    readonly subscribe = this.store.subscribe

    tokenResult: AccessTokenResult = { status: 'ok', accessToken: 'fake-token' }
    signInResult: Result<void, AuthFailureReason> = ok(undefined)
    signIns = 0
    signOuts = 0
    rejections = 0

    constructor(initial: AuthState = { status: 'signed-in' }) {
        this.store.set(initial)
    }

    setState(state: AuthState): void {
        this.store.set(state)
    }

    getAccessToken = async (): Promise<AccessTokenResult> => this.tokenResult

    signIn = async (): Promise<Result<void, AuthFailureReason>> => {
        this.signIns++
        return this.signInResult
    }

    signOut = async (): Promise<void> => {
        this.signOuts++
        this.store.set({ status: 'signed-out' })
    }

    rejectAccessToken = (): void => {
        this.rejections++
    }
}
