import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { LayoutEditingContext } from './layoutEditingContext'

/** Shared by the toggle in the app bar and the grid it controls. */
export const LayoutEditingProvider = ({
    children,
}: {
    children?: ReactNode
}) => {
    const [isEditing, setIsEditing] = useState(false)
    const toggle = useCallback(() => setIsEditing((editing) => !editing), [])
    const value = useMemo(() => ({ isEditing, toggle }), [isEditing, toggle])

    return (
        <LayoutEditingContext.Provider value={value}>
            {children}
        </LayoutEditingContext.Provider>
    )
}
