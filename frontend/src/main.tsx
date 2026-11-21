import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from '@/shared/styles/theme'
import { AppProviders } from './app/AppProviders.tsx'
import { loadConfig } from './app/config.ts'
import { createContainer } from './app/container.ts'

// Composition root: the only place that reads the build-time environment and
// decides which adapters back the ports.
const config = loadConfig(import.meta.env)

const deps = createContainer(config)

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppProviders deps={deps}>
                <App />
            </AppProviders>
        </ThemeProvider>
    </React.StrictMode>
)
