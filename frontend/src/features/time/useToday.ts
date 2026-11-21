import { toPlainDate, type PlainDate } from '@/domain/shared/time'
import { useNow } from './useNow'
import { useTimeZone } from './useTimeZone'

/** Today's calendar date in the display zone; rolls over at local midnight. */
export const useToday = (): PlainDate => toPlainDate(useNow(), useTimeZone())
