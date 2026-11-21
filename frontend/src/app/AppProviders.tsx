import type { ReactNode } from 'react'
import { QueryClientProvider } from 'react-query'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { ServicesProvider } from '@/app/services/ServicesProvider'

interface AppProvidersProps {
    readonly deps: AppDependencies
    readonly children: ReactNode
}

export const AppProviders = ({ deps, children }: AppProvidersProps) => (
    <ServicesProvider deps={deps}>
        <QueryClientProvider client={deps.queryClient}>
            {children}
        </QueryClientProvider>
    </ServicesProvider>
)
