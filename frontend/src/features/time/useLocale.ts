import { useServices } from '@/app/services/useServices'

/** The configured display locale (BCP 47). */
export const useLocale = (): string => useServices().config.locale
