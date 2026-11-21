import { useContext } from 'react'
import type { AppDependencies } from './AppDependencies'
import { ServicesContext } from './ServicesContext'

/**
 * Access to the composition root's services. Use it inside feature hooks, not
 * directly in components: components call hooks, hooks call services.
 */
export const useServices = (): AppDependencies => {
    const services = useContext(ServicesContext)
    if (services === undefined) {
        throw new Error('useServices must be used within a ServicesProvider')
    }
    return services
}
