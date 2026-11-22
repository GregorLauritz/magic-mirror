import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClientProvider } from 'react-query'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { ServicesProvider } from '@/app/services/ServicesProvider'
import { theme } from '@/shared/styles/theme'

interface AppProvidersProps {
    readonly deps: AppDependencies
    readonly children: ReactNode
}

/** Everything the whole app needs around it: services, server-state cache, theme. */
export const AppProviders = ({ deps, children }: AppProvidersProps) => (
    <ServicesProvider deps={deps}>
        <QueryClientProvider client={deps.queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    </ServicesProvider>
)
