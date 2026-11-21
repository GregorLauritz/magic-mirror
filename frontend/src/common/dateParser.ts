import { WeekdayFormat } from '../models/time'
import { parseTime } from '@/shared/lib/formatTime'
import moment from 'moment'

const ISO8601_REGEX =
    /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)$/

export const getTimezoneOffset = (useIsoFormat = false): string => {
    if (useIsoFormat) {
        const m = moment()
        const date = m.format()
        return date.replace(ISO8601_REGEX, '$2')
    } else {
        const timezoneOffset = new Date().getTimezoneOffset() / -60.0
        return timezoneOffset > 0
            ? `+${timezoneOffset}`
            : timezoneOffset.toString()
    }
}

export const getLocaleDateString = (
    date: Date,
    locale: string,
    opts: Intl.DateTimeFormatOptions
) => {
    return date.toLocaleDateString(locale, opts)
}

export const getDayName = (
    date: Date,
    locale: string,
    weekdayFormat: WeekdayFormat = 'short'
): string => {
    return getLocaleDateString(date, locale, { weekday: weekdayFormat })
}

export const getDay = (date: Date): string => {
    return date.getDate().toString().padStart(2, '0')
}

export const getMonth = (date: Date): string => {
    return (date.getMonth() + 1).toString().padStart(2, '0')
}

export const getYear = (date: Date): string => {
    return date.getFullYear().toString()
}

export const getIsoDate = (date: Date): string => {
    return `${getYear(date)}-${getMonth(date)}-${getDay(date)}`
}

export const getTimeDifferenceInHours = (
    startDate: Date,
    endDate: Date
): number => {
    const diffTime = endDate.getTime() - startDate.getTime()
    return diffTime * 2.7777777777778e-7
}

export enum TimeUnit {
    hours = 3600000,
    minutes = 60000,
    seconds = 1000,
}

// Unlike getTimeDifferenceInHours (which multiplies by an approximate
// constant and can be off by floating-point noise on exact-hour spans),
// this divides exactly - needed for allDay/multiDays detection where an
// exact multiple of 24h must equal precisely 0 modulo 24.
export const getTimeDiff = (
    date1: Date,
    date2: Date,
    unit: TimeUnit = TimeUnit.hours
): number => {
    return Math.abs(date1.getTime() - date2.getTime()) / unit
}

export const getDifferenceInDays = (startDate: Date, endDate: Date): number => {
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

export const isSameDate = (date1: Date, date2: Date): boolean => {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    )
}

export const getDateInXDays = (daysInFuture: number = 0): Date => {
    const date = new Date()
    date.setDate(date.getDate() + daysInFuture)
    return date
}

export const getISODayStartString = (
    date: Date,
    useUserTimeZone = false
): string => {
    let timeZone = 'Z'
    if (useUserTimeZone) timeZone = getTimezoneOffset(true)
    return `${getIsoDate(date)}T00:00:00.000${timeZone}`
}

export const getISODayEndString = (
    date: Date,
    useUserTimeZone = false
): string => {
    let timeZone = 'Z'
    if (useUserTimeZone) timeZone = getTimezoneOffset(true)
    return `${getIsoDate(date)}T23:59:59.999${timeZone}`
}

export const getTimeFromDate = (date: Date): string => {
    return `${parseTime(date.getHours())}:${parseTime(date.getMinutes())}`
}
