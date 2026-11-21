import type { ReactElement, ReactNode } from 'react'
import { ThemeProvider } from '@mui/material'
import {
    render,
    renderHook,
    type RenderHookOptions,
    type RenderOptions,
} from '@testing-library/react'
import { QueryClientProvider } from 'react-query'
import { MemoryRouter } from 'react-router-dom'
import { ServicesProvider } from '@/app/services/ServicesProvider'
import type { AppDependencies } from '@/app/services/AppDependencies'
import { theme } from '../../assets/styles/theme'
import {
    createTestContainer,
    type TestContainerOptions,
} from './createTestContainer'

export interface RenderDepsOptions {
    /** Use an existing container instead of building a fresh test one. */
    readonly deps?: AppDependencies
    readonly container?: TestContainerOptions
    readonly route?: string
}

const buildWrapper = (options: RenderDepsOptions) => {
    const test = options.deps
        ? undefined
        : createTestContainer(options.container)
    const deps = options.deps ?? test!.deps
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <ServicesProvider deps={deps}>
            <QueryClientProvider client={deps.queryClient}>
                <ThemeProvider theme={theme}>
                    <MemoryRouter initialEntries={[options.route ?? '/']}>
                        {children}
                    </MemoryRouter>
                </ThemeProvider>
            </QueryClientProvider>
        </ServicesProvider>
    )
    return { Wrapper, deps, test }
}

/** render() with the services, query client, theme and router in place. */
export const renderWithDeps = (
    ui: ReactElement,
    options: RenderDepsOptions & Omit<RenderOptions, 'wrapper'> = {}
) => {
    const { Wrapper, deps, test } = buildWrapper(options)
    return { ...render(ui, { wrapper: Wrapper, ...options }), deps, test }
}

/** renderHook() with the same providers. */
export const renderHookWithDeps = <Result, Props>(
    hook: (props: Props) => Result,
    options: RenderDepsOptions & Omit<RenderHookOptions<Props>, 'wrapper'> = {}
) => {
    const { Wrapper, deps, test } = buildWrapper(options)
    return { ...renderHook(hook, { wrapper: Wrapper, ...options }), deps, test }
}
