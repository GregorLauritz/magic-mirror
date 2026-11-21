import { daysBetween, type PlainDate } from '@/domain/shared/time'

// Birthday calendars name their events after a pattern of the account's
// language ("Ada's birthday", "Geburtstag von Ada"); the person is what is
// left once the pattern is removed. A title that matches no pattern is kept.
const PATTERNS: Readonly<Record<string, readonly RegExp[]>> = {
    en: [/['’]s\s+birthday$/i],
    de: [/^geburtstag\s+von\s+/i, /(?:['’]|s)\s+geburtstag$/i],
}

export const DEFAULT_BIRTHDAY_LOCALES: readonly string[] = ['en', 'de']

/** The name of the person a birthday event is about. */
export const stripBirthdaySuffix = (
    title: string,
    locales: readonly string[] = DEFAULT_BIRTHDAY_LOCALES
): string => {
    const trimmed = title.trim()
    for (const locale of locales) {
        for (const pattern of PATTERNS[locale] ?? []) {
            const name = trimmed.replace(pattern, '').trim()
            // A title that is nothing but the pattern has no name to show.
            if (name !== trimmed && name !== '') return name
        }
    }
    return trimmed
}

/** Whole days from today to a birthday; 0 means today. */
export const daysUntil = (today: PlainDate, date: PlainDate): number =>
    daysBetween(today, date)
