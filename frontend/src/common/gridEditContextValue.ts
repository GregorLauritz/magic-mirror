import { createContext } from 'react'

export interface GridEditContextType {
    isEditMode: boolean
    toggleEditMode: () => void
}

export const GridEditContext = createContext<GridEditContextType | undefined>(
    undefined
)
