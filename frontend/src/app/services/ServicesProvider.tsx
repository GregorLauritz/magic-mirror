import type { ReactNode } from 'react'
import type { AppDependencies } from './AppDependencies'
import { ServicesContext } from './ServicesContext'

interface ServicesProviderProps {
    readonly deps: AppDependencies
    readonly children: ReactNode
}

export const ServicesProvider = ({ deps, children }: ServicesProviderProps) => (
    <ServicesContext.Provider value={deps}>{children}</ServicesContext.Provider>
)
