import { loadConfig, type AppConfig } from '@/app/config'

export interface TestConfigOverrides extends Partial<
    Omit<AppConfig, 'urls' | 'http'>
> {
    readonly urls?: Partial<AppConfig['urls']>
    readonly http?: Partial<AppConfig['http']>
}

/** The production defaults with selected values replaced. */
export const createTestConfig = (
    overrides: TestConfigOverrides = {}
): AppConfig => {
    const base = loadConfig({})
    return {
        ...base,
        ...overrides,
        urls: { ...base.urls, ...overrides.urls },
        http: { ...base.http, ...overrides.http },
    }
}
