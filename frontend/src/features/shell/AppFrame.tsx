import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { LayoutEditingProvider } from '@/features/dashboard'
import { PADDING } from '@/shared/styles/theme'
import { AppHeader } from './AppHeader'

/** What every page sits in: the top bar, and the layout-editing state it shares. */
export const AppFrame = ({ children }: { children: ReactNode }) => (
    <LayoutEditingProvider>
        <AppHeader />
        <Box sx={{ p: PADDING }}>{children}</Box>
    </LayoutEditingProvider>
)
