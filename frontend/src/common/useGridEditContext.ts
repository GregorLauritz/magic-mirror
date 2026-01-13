import { useContext } from 'react'
import { GridEditContext, type GridEditContextType } from './gridEditContext'

export const useGridEditContext = (): GridEditContextType => {
    const context = useContext(GridEditContext)
    if (context === undefined) {
        throw new Error(
            'useGridEditContext must be used within a GridEditContextProvider'
        )
    }
    return context
}
