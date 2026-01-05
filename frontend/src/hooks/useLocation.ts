import { useContext } from 'react'
import { LocationContext } from '../common/LocationContext'

export const useLocation = () => {
    return useContext(LocationContext)
}
