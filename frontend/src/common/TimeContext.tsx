import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

type TimeContextType = {
    newDay: boolean
    newHour: boolean
    timeZone: string
    currentDate: Date
}

const defaultValue: TimeContextType = {
    newDay: false,
    newHour: false,
    timeZone: 'GMT',
    currentDate: new Date(),
}

const TimeContext = createContext(defaultValue)

const getTimeZone = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timeZone
}

const TimeContextProvider = ({ children }: { children: JSX.Element }) => {
    const [newDay, setNewDay] = useState(false)
    const [newHour, setNewHour] = useState(false)
    const [previousDate, setPreviousDate] = useState(new Date())
    const [previousHours, setPreviousHours] = useState(previousDate.getHours())
    const [timeZone, setTimeZone] = useState(getTimeZone())
    const [currentDate, setCurrentDate] = useState(new Date())

    const handleDayCheck = useCallback(
        (currentDate: Date) => {
            const isNewDay = currentDate.getDate() !== previousDate.getDate()
            if (newDay !== isNewDay) {
                setNewDay(isNewDay)
                setPreviousDate(currentDate)
                setTimeZone(getTimeZone())
                setCurrentDate(currentDate)
            }
        },
        [newDay, setPreviousDate, previousDate]
    )

    const handleHourCheck = useCallback(
        (currentDate: Date) => {
            if (currentDate.getHours() !== previousHours) {
                setNewHour(true)
                setPreviousHours(currentDate.getHours())
            }
        },
        [previousHours]
    )

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentDate = new Date()
            handleDayCheck(currentDate)
            handleHourCheck(currentDate)
        }, 1000)
        return () => clearInterval(intervalId)
    }, [previousDate, handleDayCheck, handleHourCheck])

    const value = useMemo(
        () => ({ newDay, newHour, timeZone, currentDate }),
        [newDay, newHour, timeZone, currentDate]
    )

    return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>
}

export { TimeContextProvider, TimeContext }
