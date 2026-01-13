import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react'

interface GridEditContextType {
    isEditMode: boolean
    toggleEditMode: () => void
}

const GridEditContext = createContext<GridEditContextType | undefined>(
    undefined
)

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

export const useGridEditContext = (): GridEditContextType => {
    const context = useContext(GridEditContext)
    if (context === undefined) {
        throw new Error(
            'useGridEditContext must be used within a GridEditContextProvider'
        )
    }
    return context
}
