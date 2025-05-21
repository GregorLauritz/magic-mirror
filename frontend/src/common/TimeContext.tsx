import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

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

type UpdateTrigger = () => void

const TimeContext = createContext(defaultValue)

const getTimeZone = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timeZone
}

type Props = { children: JSX.Element }

const TimeContextProvider = ({ children }: Props) => {
    const [timeZone, setTimeZone] = useState(getTimeZone())
    const [currentDate, setCurrentDate] = useState(new Date())

    const hourlyTriggers = useRef<Set<UpdateTrigger>>(new Set())
    const dailyTriggers = useRef<Set<UpdateTrigger>>(new Set())
    const prevHour = useRef(currentDate.getHours())
    const prevDay = useRef(currentDate.getDate())

    const addHourlyUpdateTrigger = useCallback((trigger: UpdateTrigger) => {
        hourlyTriggers.current.add(trigger)
    }, [])

    const addDailyUpdateTrigger = useCallback((trigger: UpdateTrigger) => {
        dailyTriggers.current.add(trigger)
    }, [])

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

    const value = useMemo(
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

export { TimeContextProvider, TimeContext }
