import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    memo,
    type ReactNode,
} from 'react'

type UpdateTrigger = () => void

type TimeContextType = {
    addHourlyUpdateTrigger: (trigger: UpdateTrigger) => void
    addDailyUpdateTrigger: (trigger: UpdateTrigger) => void
    timeZone: string
    currentDate: Date
}

const defaultValue: TimeContextType = {
    addHourlyUpdateTrigger: () => {},
    addDailyUpdateTrigger: () => {},
    timeZone: 'GMT',
    currentDate: new Date(),
}

const TimeContext = createContext<TimeContextType>(defaultValue)

const getTimeZone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
}

interface TimeContextProviderProps {
    children: ReactNode
}

const TimeContextProviderComponent = ({
    children,
}: TimeContextProviderProps) => {
    const [timeZone, setTimeZone] = useState<string>(getTimeZone())
    const [currentDate, setCurrentDate] = useState<Date>(new Date())

    const hourlyTriggers = useRef<Set<UpdateTrigger>>(new Set())
    const dailyTriggers = useRef<Set<UpdateTrigger>>(new Set())
    const prevHour = useRef<number>(new Date().getHours())
    const prevDay = useRef<number>(new Date().getDate())

    const addHourlyUpdateTrigger = useCallback(
        (trigger: UpdateTrigger): void => {
            hourlyTriggers.current.add(trigger)
        },
        []
    )

    const addDailyUpdateTrigger = useCallback(
        (trigger: UpdateTrigger): void => {
            dailyTriggers.current.add(trigger)
        },
        []
    )

    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date()
            if (now.getHours() !== prevHour.current) {
                hourlyTriggers.current.forEach((trigger) => trigger())
                prevHour.current = now.getHours()
            }
            if (now.getDate() !== prevDay.current) {
                setCurrentDate(now)
                dailyTriggers.current.forEach((trigger) => trigger())
                prevDay.current = now.getDate()
                setTimeZone(getTimeZone())
            }
        }, 5000)
        return () => clearInterval(intervalId)
    }, [])

    const value = useMemo<TimeContextType>(
        () => ({
            timeZone,
            currentDate,
            addHourlyUpdateTrigger,
            addDailyUpdateTrigger,
        }),
        [timeZone, currentDate, addHourlyUpdateTrigger, addDailyUpdateTrigger]
    )

    return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>
}

const TimeContextProvider = memo(TimeContextProviderComponent)
TimeContextProvider.displayName = 'TimeContextProvider'

export { TimeContextProvider, TimeContext }
export type { UpdateTrigger, TimeContextType }
