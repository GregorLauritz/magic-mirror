import { describe, expect, it } from 'vitest'
import { act } from '@testing-library/react'
import {
    useResetLocalData,
    useSaveSettings,
    useSetting,
    useSettings,
} from '@/features/settings'
import { STORAGE_KEYS } from '@/infrastructure/storage/storageKeys'
import { createTestContainer } from '../../support/createTestContainer'
import { InMemoryKeyValueStore } from '../../support/InMemoryKeyValueStore'
import { renderHookWithDeps } from '../../support/renderWithDeps'
import { FULL_RAW } from '../../infrastructure/storage/legacyFixtures'

const containerWith = (raw?: object) => {
    const localStore = new InMemoryKeyValueStore()
    if (raw) localStore.set(STORAGE_KEYS.userSettings, JSON.stringify(raw))
    return createTestContainer({ localStore })
}

describe('useSettings', () => {
    it('has the saved settings on the very first render', () => {
        const test = containerWith(FULL_RAW)

        const { result } = renderHookWithDeps(() => useSettings(), {
            deps: test.deps,
        })

        expect(result.current.address).toEqual({
            country: 'DE',
            city: 'Stuttgart',
            postalCode: '70176',
        })
    })

    it('re-renders when the settings change', () => {
        const test = containerWith()
        const { result } = renderHookWithDeps(() => useSettings(), {
            deps: test.deps,
        })

        act(() => {
            test.deps.settings.patch({ eventsCalendarId: 'primary' })
        })

        expect(result.current.eventsCalendarId).toBe('primary')
    })
})

describe('useSetting', () => {
    it('re-renders only when the picked value changes', () => {
        const test = containerWith(FULL_RAW)
        let renders = 0
        const { result } = renderHookWithDeps(
            () => {
                renders++
                return useSetting((s) => s.address)
            },
            { deps: test.deps }
        )
        const rendersAfterMount = renders
        const address = result.current

        act(() => {
            test.deps.settings.patch({
                layout: [{ widgetId: 'time', x: 0, y: 0, w: 1, h: 1 }],
            })
        })
        expect(renders).toBe(rendersAfterMount) // an unrelated change is invisible
        expect(result.current).toBe(address)

        act(() => {
            test.deps.settings.patch({
                address: { country: 'AT', city: 'Wien', postalCode: '' },
            })
        })
        expect(result.current?.country).toBe('AT')
    })
})

describe('use cases as hooks', () => {
    it('exposes saveSettings and resetLocalData from the container', () => {
        const test = containerWith()

        const save = renderHookWithDeps(() => useSaveSettings(), {
            deps: test.deps,
        })
        const reset = renderHookWithDeps(() => useResetLocalData(), {
            deps: test.deps,
        })

        expect(save.result.current).toBe(test.deps.saveSettings)
        expect(reset.result.current).toBe(test.deps.resetLocalData)
    })
})
