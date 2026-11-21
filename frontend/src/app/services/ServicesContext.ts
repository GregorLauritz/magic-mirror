import { createContext } from 'react'
import type { AppDependencies } from './AppDependencies'

export const ServicesContext = createContext<AppDependencies | undefined>(
    undefined
)
