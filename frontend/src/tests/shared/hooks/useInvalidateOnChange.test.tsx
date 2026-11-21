import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useQuery } from 'react-query'
import { useInvalidateOnChange } from '@/shared/hooks/useInvalidateOnChange'
import { createTestContainer } from '../../support/createTestContainer'
import { renderHookWithDeps } from '../../support/renderWithDeps'

const KEY = ['probe']

const setup = (options: { enabled?: boolean; strict?: boolean } = {}) => {
    const test = createTestContainer()
    const fetcher = vi.fn().mockResolvedValue('data')
    const rendered = renderHookWithDeps(
        ({ changeKey }: { changeKey: string }) => {
            useQuery(KEY, fetcher, {
                enabled: options.enabled ?? true,
                staleTime: Infinity,
            })
            useInvalidateOnChange(changeKey, KEY)
        },
        { deps: test.deps, strict: options.strict },
        { initialProps: { changeKey: 'a' } }
    )
    return { ...rendered, fetcher }
}

describe('useInvalidateOnChange', () => {
    it('does not refetch on mount', async () => {
        const { fetcher } = setup()
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

        expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('refetches the active query when the key changes', async () => {
        const { rerender, fetcher } = setup()
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

        rerender({ changeKey: 'b' })

        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    })

    it('does nothing while the key stays the same', async () => {
        const { rerender, fetcher } = setup()
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

        rerender({ changeKey: 'a' })
        rerender({ changeKey: 'a' })

        expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('does not fetch a disabled query when the key changes', async () => {
        const { rerender, fetcher } = setup({ enabled: false })

        rerender({ changeKey: 'b' })
        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(fetcher).not.toHaveBeenCalled()
    })

    it('does not trigger a spurious invalidation under StrictMode', async () => {
        const { fetcher } = setup({ strict: true })
        await waitFor(() => expect(fetcher).toHaveBeenCalled())
        const callsAfterMount = fetcher.mock.calls.length

        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(fetcher).toHaveBeenCalledTimes(callsAfterMount)
    })
})
