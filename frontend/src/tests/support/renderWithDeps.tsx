import { Fragment, StrictMode, type ReactElement, type ReactNode } from 'react'
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
import { theme } from '@/shared/styles/theme'
import {
    createTestContainer,
    type TestContainerOptions,
} from './createTestContainer'

export interface RenderDepsOptions {
    /** Use an existing container instead of building a fresh test one. */
    readonly deps?: AppDependencies
    /** Options for the fake-backed container built when `deps` is not given. */
    readonly testContainer?: TestContainerOptions
    readonly route?: string
    /** Wrap in <StrictMode> to surface double-mount / double-effect bugs. */
    readonly strict?: boolean
}

const buildWrapper = (options: RenderDepsOptions) => {
    const test = options.deps
        ? undefined
        : createTestContainer(options.testContainer)
    const deps = options.deps ?? test!.deps
    const Strict = options.strict ? StrictMode : Fragment
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <Strict>
            <ServicesProvider deps={deps}>
                <QueryClientProvider client={deps.queryClient}>
                    <ThemeProvider theme={theme}>
                        <MemoryRouter initialEntries={[options.route ?? '/']}>
                            {children}
                        </MemoryRouter>
                    </ThemeProvider>
                </QueryClientProvider>
            </ServicesProvider>
        </Strict>
    )
    return { Wrapper, deps, test }
}

/** render() with the services, query client, theme and router in place. */
export const renderWithDeps = (
    ui: ReactElement,
    depsOptions: RenderDepsOptions = {},
    renderOptions: Omit<RenderOptions, 'wrapper'> = {}
) => {
    const { Wrapper, deps, test } = buildWrapper(depsOptions)
    return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), deps, test }
}

/** renderHook() with the same providers. */
export const renderHookWithDeps = <Result, Props>(
    hook: (props: Props) => Result,
    depsOptions: RenderDepsOptions = {},
    renderOptions: Omit<RenderHookOptions<Props>, 'wrapper'> = {}
) => {
    const { Wrapper, deps, test } = buildWrapper(depsOptions)
    return {
        ...renderHook(hook, { wrapper: Wrapper, ...renderOptions }),
        deps,
        test,
    }
}
