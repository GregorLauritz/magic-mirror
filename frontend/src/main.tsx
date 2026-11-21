import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './app/AppProviders.tsx'
import { loadConfig } from './app/config.ts'
import { createContainer } from './app/container.ts'
import { createAppRouter } from './app/router.tsx'

// Composition root: the only place that reads the build-time environment and
// decides which adapters back the ports.
const config = loadConfig(import.meta.env)

const deps = createContainer(config)
deps.start()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppProviders deps={deps}>
            <RouterProvider router={createAppRouter()} />
        </AppProviders>
    </React.StrictMode>
)
