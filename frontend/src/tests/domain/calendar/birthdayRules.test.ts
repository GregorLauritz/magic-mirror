import { describe, expect, it } from 'vitest'
import { daysUntil, stripBirthdaySuffix } from '@/domain/calendar/birthdayRules'
import { plainDate } from '@/domain/shared/time'

describe('stripBirthdaySuffix (B4: the legacy replace("\'s Birthday") was case-sensitive and English-only)', () => {
    it.each([
        ["John Doe's birthday", 'John Doe'], // what Google's English calendar writes
        ["John Doe's Birthday", 'John Doe'], // the capital B the legacy code expected
        ['John Doe’s birthday', 'John Doe'], // typographic apostrophe
        ["JOHN DOE'S BIRTHDAY", 'JOHN DOE'],
        ["  Anna's birthday  ", 'Anna'],
        ['Peters Geburtstag', 'Peter'], // German genitive
        ["Hans' Geburtstag", 'Hans'],
        ['Geburtstag von Anna Schmidt', 'Anna Schmidt'],
    ])('%j becomes %j', (title, expected) => {
        expect(stripBirthdaySuffix(title)).toBe(expected)
    })

    it.each(['Team offsite', 'Birthday party', "Mia's party", 'Anna', ''])(
        'leaves %j alone',
        (title) => {
            expect(stripBirthdaySuffix(title)).toBe(title.trim())
        }
    )

    it('only strips at the end, so a name that contains the word is untouched', () => {
        expect(stripBirthdaySuffix("Birthday Bob's birthday")).toBe(
            'Birthday Bob'
        )
    })

    it('does not strip a suffix of a locale that is not enabled', () => {
        expect(stripBirthdaySuffix('Peters Geburtstag', ['en'])).toBe(
            'Peters Geburtstag'
        )
    })
})

describe('daysUntil', () => {
    it.each([
        ['2024-01-15', '2024-01-15', 0],
        ['2024-01-15', '2024-01-16', 1],
        ['2024-01-15', '2024-02-14', 30],
        ['2024-02-27', '2024-03-01', 3], // leap day in between
    ])('from %s to %s is %i', (today, date, expected) => {
        expect(daysUntil(plainDate(today), plainDate(date))).toBe(expected)
    })
})
