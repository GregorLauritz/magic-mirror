import type { Instant } from '@/domain/shared/time'

export interface AuthToken {
    readonly accessToken: string
    /** When Google stops accepting it. */
    readonly expiresAt: Instant
}

/** Usable for a request now, with a safety margin so it cannot expire mid-flight. */
export const isUsable = (
    token: AuthToken,
    now: Instant,
    marginMs: number
): boolean => token.expiresAt - marginMs > now

export type AuthFailureReason =
    | 'access_denied'
    | 'popup_closed'
    | 'popup_blocked'
    | 'script_unavailable'
    | 'timeout'
    | 'unknown'

export type AuthState =
    | { readonly status: 'signed-out'; readonly lastError?: AuthFailureReason }
    | { readonly status: 'signing-in' }
    /** A token record exists (possibly expired: a silent refresh renews it). */
    | { readonly status: 'signed-in' }
    /** The record exists but renewing it failed; the user must sign in again. */
    | { readonly status: 'needs-reauth'; readonly reason: AuthFailureReason }

export type AccessTokenResult =
    | { readonly status: 'ok'; readonly accessToken: string }
    | { readonly status: 'signed-out' }
    | { readonly status: 'refresh-failed'; readonly reason: AuthFailureReason }
