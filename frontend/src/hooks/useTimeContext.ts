import { useContext } from 'react'
import { TimeContext } from '../common/TimeContext'

export const useTimeContext = () => {
    return useContext(TimeContext)
}
