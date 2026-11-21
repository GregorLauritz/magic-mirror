import { describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StationAutocomplete } from '@/features/trains/StationAutocomplete'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeTrainProvider } from '../../support/FakeTrainProvider'
import { renderWithDeps } from '../../support/renderWithDeps'

const BERLIN = { id: '8011160', name: 'Berlin Hbf' }

const setup = (
    provider: FakeTrainProvider,
    value: { id: string; name: string } | null = null
) => {
    const test = createTestContainer({ trainProvider: provider })
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithDeps(
        <StationAutocomplete
            label="Departure Station"
            value={value}
            onChange={onChange}
        />,
        { deps: test.deps }
    )
    return { test, onChange, user, input: () => screen.getByRole('combobox') }
}

describe('StationAutocomplete', () => {
    it('shows the name of the chosen station', () => {
        const { input } = setup(new FakeTrainProvider({ stations: [] }), BERLIN)

        expect(input()).toHaveValue('Berlin Hbf')
    })

    it('offers stations after the typing pause and reports the chosen one', async () => {
        const provider = new FakeTrainProvider({
            stations: [BERLIN, { id: '2', name: 'Bern' }],
        })
        const { test, onChange, user, input } = setup(provider)

        await user.type(input(), 'Ber')
        expect(provider.stationCalls).toEqual([])
        act(() => test.scheduler.advance(300))
        await user.click(
            await screen.findByRole('option', { name: 'Berlin Hbf' })
        )

        expect(provider.stationCalls).toEqual([{ query: 'Ber', limit: 10 }])
        expect(onChange).toHaveBeenCalledWith(BERLIN)
    })

    it('asks only once for a quickly typed name', async () => {
        const provider = new FakeTrainProvider({ stations: [BERLIN] })
        const { test, user, input } = setup(provider)

        await user.type(input(), 'Berlin')
        act(() => test.scheduler.advance(300))
        await screen.findByRole('option', { name: 'Berlin Hbf' })

        expect(provider.stationCalls).toHaveLength(1)
    })

    it('does not ask for a single character', async () => {
        const provider = new FakeTrainProvider({ stations: [BERLIN] })
        const { test, user, input } = setup(provider)

        await user.type(input(), 'B')
        act(() => test.scheduler.advance(300))
        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(provider.stationCalls).toEqual([])
    })

    it('keeps the chosen station among the options', async () => {
        const { user, input } = setup(
            new FakeTrainProvider({ stations: [] }),
            BERLIN
        )

        await user.click(input())

        expect(
            await screen.findByRole('option', { name: 'Berlin Hbf' })
        ).toBeInTheDocument()
    })

    it('reports that the selection was cleared', async () => {
        const { user, onChange } = setup(
            new FakeTrainProvider({ stations: [] }),
            BERLIN
        )

        // MUI hides the clear button until the field is hovered, which also
        // empties its accessible name: find it by title instead.
        await user.click(screen.getByTitle('Clear'))

        expect(onChange).toHaveBeenCalledWith(null)
    })

    it('says when the stations cannot be loaded', async () => {
        const provider = new FakeTrainProvider({ stations: new Error('boom') })
        const { test, user, input } = setup(provider)

        await user.type(input(), 'Be')
        act(() => test.scheduler.advance(300))

        expect(
            await screen.findByText('Error loading stations')
        ).toBeInTheDocument()
    })
})
