import type { Measurement } from '@/domain/shared/Measurement'

const MISSING = '-'

// A missing value (null) shows as a dash instead of "null" or "NaN".
export const plain = (m: Measurement): string =>
    m.value === null ? MISSING : String(m.value)

export const rounded = (m: Measurement): string =>
    m.value === null ? MISSING : String(Math.round(m.value))

export const fixed = (m: Measurement, digits = 0): string =>
    m.value === null ? MISSING : m.value.toFixed(digits)
