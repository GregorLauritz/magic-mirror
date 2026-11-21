import { describe, expect, it } from 'vitest'
import { isUsable } from '@/domain/auth/AuthToken'
import { instant } from '@/domain/shared/time'

const MARGIN = 60_000
const token = (expiresAt: number) => ({
    accessToken: 't',
    expiresAt: instant(expiresAt),
})

describe('isUsable', () => {
    it('is true while the token outlives the safety margin', () => {
        expect(isUsable(token(1_000_000), instant(900_000), MARGIN)).toBe(true)
    })

    it('is false inside the safety margin, so a request never races the expiry', () => {
        expect(isUsable(token(1_000_000), instant(950_000), MARGIN)).toBe(false)
    })

    it('is false exactly at the margin and after expiry', () => {
        expect(isUsable(token(1_000_000), instant(940_000), MARGIN)).toBe(false)
        expect(isUsable(token(1_000_000), instant(2_000_000), MARGIN)).toBe(
            false
        )
    })
})
