import { useServices } from '@/app/services/useServices'
import type { Birthday } from '@/domain/calendar/Birthday'
import { googleQueryKey, useAuthenticatedQuery } from '@/features/auth'
import { useToday } from '@/features/time'
import { useInvalidateOnChange } from '@/shared/hooks/useInvalidateOnChange'
import { calendarKeys } from '../calendarKeys'
import { BIRTHDAY_LIMIT } from '../constants'

export interface BirthdaysState {
    /** The next birthdays, or undefined until a load succeeded. */
    readonly birthdays: readonly Birthday[] | undefined
    /** False when no birthday calendar is chosen: then nothing is requested. */
    readonly isConfigured: boolean
    readonly isLoading: boolean
    readonly isError: boolean
}

export const useBirthdays = (
    calendarId: string | undefined,
    limit: number = BIRTHDAY_LIMIT
): BirthdaysState => {
    const { calendar, config } = useServices()
    const id = calendarId?.trim() ?? ''
    const isConfigured = id !== ''
    const key = calendarKeys.birthdays(id, limit)

    const query = useAuthenticatedQuery(
        key,
        ({ signal }) =>
            calendar.getBirthdays({ calendarId: id, limit }, signal),
        { enabled: isConfigured, refetchIntervalMs: config.refreshIntervalMs }
    )
    // "Upcoming" starts today: after midnight the list has to be asked again.
    useInvalidateOnChange(useToday(), googleQueryKey(key))

    return {
        birthdays: query.data,
        isConfigured,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}
