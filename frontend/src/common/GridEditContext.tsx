import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { GridEditContext } from './gridEditContext'

interface GridEditContextProviderProps {
    children: ReactNode
}

export const GridEditContextProvider = ({
    children,
}: GridEditContextProviderProps) => {
    const [isEditMode, setIsEditMode] = useState(false)

    const toggleEditMode = useCallback(() => {
        setIsEditMode((prev) => !prev)
    }, [])

    const value = useMemo(
        () => ({
            isEditMode,
            toggleEditMode,
        }),
        [isEditMode, toggleEditMode]
    )

    return (
        <GridEditContext.Provider value={value}>
            {children}
        </GridEditContext.Provider>
    )
}
