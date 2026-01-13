import { useQuery } from 'react-query'
import {
    getDay,
    getDayName,
    getMonth,
    getTimezoneOffset,
    getYear,
} from '../common/dateParser'
import { ServerStateKeysEnum } from '../common/statekeys'
import { parseTime } from '../common/timeParser'
import { DEFAULT_LOCALE } from '../constants/defaults'
import { TimeObject } from '../models/time'

export const useGetTime = (
    delim: string = '.',
    locale: string = DEFAULT_LOCALE
) =>
    useQuery<TimeObject, Error>({
        queryKey: [ServerStateKeysEnum.time, locale],
        queryFn: async () =>
            getTime(delim, locale).catch((err) => {
                throw err
            }),
        refetchInterval: 100, // Refetch every 100 ms to keep time updated
    })

const getTime = async (
    delim: string = '.',
    locale: string = DEFAULT_LOCALE
): Promise<TimeObject> => {
    const now = new Date()
    const timeObj: TimeObject = {
        hour: parseTime(now.getHours()),
        minute: parseTime(now.getMinutes()),
        seconds: parseTime(now.getSeconds()),
        currentDate: parseDate(now, delim),
        timezoneOffset: getTimezoneOffset(false),
        weekdayLong: getDayName(now, locale, 'long'),
        weekdayShort: getDayName(now, locale, 'short'),
    }
    return timeObj
}

const parseDate = (date: Date, delim: string = '.'): string => {
    return `${[getDay(date), getMonth(date), getYear(date)].join(delim)}`
}
