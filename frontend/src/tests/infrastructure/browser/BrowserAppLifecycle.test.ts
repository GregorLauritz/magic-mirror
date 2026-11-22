import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrowserAppLifecycle } from '@/infrastructure/browser/BrowserAppLifecycle'

describe('BrowserAppLifecycle', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('reloads the page', () => {
        const reload = vi.fn()
        vi.stubGlobal('location', { ...window.location, reload })

        new BrowserAppLifecycle().reload()

        expect(reload).toHaveBeenCalledTimes(1)
    })
})
