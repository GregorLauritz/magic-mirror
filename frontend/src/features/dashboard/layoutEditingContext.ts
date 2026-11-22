import { createContext, useContext } from 'react'

export interface LayoutEditing {
    /** Whether the widgets can be moved and resized right now. */
    readonly isEditing: boolean
    readonly toggle: () => void
}

export const LayoutEditingContext = createContext<LayoutEditing | undefined>(
    undefined
)

export const useLayoutEditing = (): LayoutEditing => {
    const context = useContext(LayoutEditingContext)
    if (context === undefined) {
        throw new Error(
            'useLayoutEditing must be used within a LayoutEditingProvider'
        )
    }
    return context
}
