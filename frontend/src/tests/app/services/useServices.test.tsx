import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useServices } from '@/app/services/useServices'
import { renderHookWithDeps } from '../../support/renderWithDeps'
import { createTestContainer } from '../../support/createTestContainer'

describe('useServices', () => {
    it('returns the dependencies that the provider was given', () => {
        const { deps } = createTestContainer()

        const { result } = renderHookWithDeps(() => useServices(), { deps })

        expect(result.current).toBe(deps)
    })

    it('fails loudly when used outside a ServicesProvider', () => {
        // React logs the thrown error; keep the test output clean.
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        expect(() => renderHook(() => useServices())).toThrow(
            'useServices must be used within a ServicesProvider'
        )

        consoleError.mockRestore()
    })
})
