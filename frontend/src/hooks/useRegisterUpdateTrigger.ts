import { useEffect, useRef } from 'react'
import { UpdateTrigger } from '../common/TimeContext'

export const useRegisterUpdateTrigger = (
    registerFn: (trigger: UpdateTrigger) => void,
    refetchFn: () => void
): void => {
    const isRegistered = useRef<boolean>(false)

    useEffect(() => {
        if (!isRegistered.current) {
            registerFn(refetchFn)
            isRegistered.current = true
        }
    }, [registerFn, refetchFn])
}
